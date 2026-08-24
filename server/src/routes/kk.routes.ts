import type { FastifyInstance } from "fastify";
import { db } from "../db/index.js";
import { kartuKeluargaTable, pendudukTable, hashKependudukan } from "../db/schema/schema.js";
import { eq, ilike, and, sql, asc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { getPublicFotoUrl } from "../lib/minio.js";

type KartuKeluargaInsert = typeof kartuKeluargaTable.$inferInsert;
type ParamsWithId = { id: string };

function withFotoUrl<T extends { foto?: string | null }>(item: T | undefined | null) {
  if (!item) return null;
  return {
    ...item,
    fotoUrl: getPublicFotoUrl(item.foto),
  };
}

export default async function kkRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", requireAuth);

  // 1. GET /api/kk (List Kartu Keluarga dengan pagination, search, filter RT/RW, dan data Kepala Keluarga)
  fastify.get("/api/kk", async (request, reply) => {
    try {
      const { search, nokk, rt, rw, dusun, limit = 100, page = 1 } = request.query as any;
      const offset = (Number(page) - 1) * Number(limit);

      const conditions = [];

      if (nokk) {
        conditions.push(eq(kartuKeluargaTable.noKkHash, hashKependudukan(nokk)));
      }

      if (rt) {
        conditions.push(eq(kartuKeluargaTable.rt, rt));
      }

      if (rw) {
        conditions.push(eq(kartuKeluargaTable.rw, rw));
      }

      if (dusun) {
        conditions.push(ilike(kartuKeluargaTable.dusun, `%${dusun}%`));
      }

      const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

      // Subquery count anggota per KK
      const totalCount = await db
        .select({ count: sql<number>`cast(count(${kartuKeluargaTable.id}) as integer)` })
        .from(kartuKeluargaTable)
        .where(whereCondition);

      const kkList = await db
        .select({
          id: kartuKeluargaTable.id,
          noKk: kartuKeluargaTable.noKk,
          noKkHash: kartuKeluargaTable.noKkHash,
          kepalaKeluargaId: kartuKeluargaTable.kepalaKeluargaId,
          alamat: kartuKeluargaTable.alamat,
          rt: kartuKeluargaTable.rt,
          rw: kartuKeluargaTable.rw,
          dusun: kartuKeluargaTable.dusun,
          kodePos: kartuKeluargaTable.kodePos,
          tanggalDikeluarkan: kartuKeluargaTable.tanggalDikeluarkan,
          kepalaKeluargaNama: pendudukTable.namaLengkap,
          kepalaKeluargaNik: pendudukTable.nik,
        })
        .from(kartuKeluargaTable)
        .leftJoin(pendudukTable, eq(kartuKeluargaTable.kepalaKeluargaId, pendudukTable.id))
        .where(whereCondition)
        .limit(Number(limit))
        .offset(offset);

      // Filter search nama kepala keluarga atau no KK jika ada query search
      let filteredData = kkList;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredData = kkList.filter((item) => {
          return (
            (item.kepalaKeluargaNama && item.kepalaKeluargaNama.toLowerCase().includes(searchLower)) ||
            (item.noKk && item.noKk.includes(search))
          );
        });
      }

      const kkIds = filteredData.map((k) => k.id);
      let memberCounts: Record<string, number> = {};
      let memberNames: Record<string, string[]> = {};

      if (kkIds.length > 0) {
        const members = await db
          .select({
            kartuKeluargaId: pendudukTable.kartuKeluargaId,
            namaLengkap: pendudukTable.namaLengkap,
            shdk: pendudukTable.shdk,
          })
          .from(pendudukTable)
          .where(sql`${pendudukTable.kartuKeluargaId} IN ${kkIds}`)
          .orderBy(asc(pendudukTable.urutanKk));

        members.forEach((m) => {
          if (m.kartuKeluargaId) {
            memberCounts[m.kartuKeluargaId] = (memberCounts[m.kartuKeluargaId] || 0) + 1;
            if (!memberNames[m.kartuKeluargaId]) {
              memberNames[m.kartuKeluargaId] = [];
            }
            memberNames[m.kartuKeluargaId]!.push(m.namaLengkap);
          }
        });
      }

      const result = filteredData.map((kk) => ({
        ...kk,
        jumlahAnggota: memberCounts[kk.id] || 0,
        daftarAnggota: memberNames[kk.id] || [],
      }));

      const total = totalCount[0]?.count ?? 0;
      const totalPages = Math.ceil(total / Number(limit));

      return reply.send({
        success: true,
        data: result,
        meta: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ success: false, message: "Gagal mengambil data Kartu Keluarga." });
    }
  });

  // 2. GET /api/kk/:id (Detail KK lengkap beserta seluruh anggota keluarganya)
  fastify.get<{ Params: ParamsWithId }>("/api/kk/:id", async (request, reply) => {
    try {
      const { id } = request.params;

      const kkData = await db
        .select()
        .from(kartuKeluargaTable)
        .where(eq(kartuKeluargaTable.id, id));

      const record = kkData[0];
      if (!record) {
        return reply.status(404).send({ success: false, message: "Data Kartu Keluarga tidak ditemukan." });
      }

      // Ambil seluruh anggota keluarga yang terhubung
      const anggota = await db
        .select()
        .from(pendudukTable)
        .where(eq(pendudukTable.kartuKeluargaId, id))
        .orderBy(asc(pendudukTable.urutanKk));

      // Cari data kepala keluarga
      const kepalaKeluarga = anggota.find((a) => a.id === record.kepalaKeluargaId) || null;

      return reply.send({
        success: true,
        data: {
          ...record,
          kepalaKeluarga: withFotoUrl(kepalaKeluarga),
          anggota: anggota.map(withFotoUrl),
          jumlahAnggota: anggota.length,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ success: false, message: "Gagal mengambil data Kartu Keluarga." });
    }
  });

  // 3. POST /api/kk (Tambah Kartu Keluarga Baru)
  fastify.post<{ Body: KartuKeluargaInsert }>("/api/kk", async (request, reply) => {
    try {
      const body = request.body;

      if (!body.noKk) {
        return reply.status(400).send({ success: false, message: "Nomor KK wajib diisi." });
      }

      const noKkHash = hashKependudukan(body.noKk);

      // Cek apakah No KK sudah terdaftar
      const existing = await db
        .select()
        .from(kartuKeluargaTable)
        .where(eq(kartuKeluargaTable.noKkHash, noKkHash));

      if (existing.length > 0) {
        return reply.status(400).send({ success: false, message: "Nomor KK sudah terdaftar." });
      }

      const newKK = await db
        .insert(kartuKeluargaTable)
        .values({
          ...body,
          noKkHash,
        })
        .returning();

      const created = newKK[0];
      return reply.status(201).send({
        success: true,
        message: "Data Kartu Keluarga berhasil ditambahkan.",
        data: created,
      });
    } catch (error: any) {
      fastify.log.error(error);
      const isUniqueViolation =
        error?.code === "23505" ||
        error?.cause?.code === "23505" ||
        error?.message?.includes("duplicate key") ||
        error?.cause?.message?.includes("duplicate key");

      if (isUniqueViolation) {
        return reply.status(400).send({ success: false, message: "Nomor KK sudah terdaftar." });
      }
      return reply.status(500).send({ success: false, message: "Gagal menyimpan data Kartu Keluarga." });
    }
  });

  // 4. PUT /api/kk/:id (Update Data Kartu Keluarga)
  fastify.put<{ Params: ParamsWithId; Body: Partial<KartuKeluargaInsert> }>("/api/kk/:id", async (request, reply) => {
    try {
      const { id } = request.params;
      const body = request.body;

      const updatePayload: Partial<KartuKeluargaInsert> = { ...body };
      if (body.noKk) {
        updatePayload.noKkHash = hashKependudukan(body.noKk);
      }

      const updatedData = await db
        .update(kartuKeluargaTable)
        .set(updatePayload)
        .where(eq(kartuKeluargaTable.id, id))
        .returning();

      const updated = updatedData[0];
      if (!updated) {
        return reply.status(404).send({ success: false, message: "Data Kartu Keluarga tidak ditemukan." });
      }

      // Jika alamat / RT / RW / No KK berubah, sinkronkan ke seluruh anggota keluarga
      if (body.alamat || body.rt || body.rw || body.noKk) {
        const syncPayload: any = {};
        if (body.alamat) syncPayload.alamat = body.alamat;
        if (body.rt) syncPayload.rt = body.rt;
        if (body.rw) syncPayload.rw = body.rw;
        if (body.noKk) {
          syncPayload.noKk = body.noKk;
          syncPayload.noKkHash = hashKependudukan(body.noKk);
        }

        await db
          .update(pendudukTable)
          .set(syncPayload)
          .where(eq(pendudukTable.kartuKeluargaId, id));
      }

      return reply.send({
        success: true,
        message: "Data Kartu Keluarga berhasil diperbarui.",
        data: updated,
      });
    } catch (error: any) {
      fastify.log.error(error);
      const isUniqueViolation =
        error?.code === "23505" ||
        error?.cause?.code === "23505" ||
        error?.message?.includes("duplicate key") ||
        error?.cause?.message?.includes("duplicate key");

      if (isUniqueViolation) {
        return reply.status(400).send({ success: false, message: "Nomor KK sudah terdaftar." });
      }
      return reply.status(500).send({ success: false, message: "Gagal memperbarui data Kartu Keluarga." });
    }
  });

  // 5. POST /api/kk/:id/anggota (Menambahkan Penduduk ke Dalam KK)
  fastify.post<{
    Params: ParamsWithId;
    Body: { pendudukId: string; shdk?: string; urutanKk?: string };
  }>("/api/kk/:id/anggota", async (request, reply) => {
    try {
      const { id } = request.params;
      const { pendudukId, shdk = "ANGGOTA KELUARGA", urutanKk } = request.body;

      if (!pendudukId) {
        return reply.status(400).send({ success: false, message: "Penduduk ID wajib disertakan." });
      }

      const kk = await db.select().from(kartuKeluargaTable).where(eq(kartuKeluargaTable.id, id));
      const targetKk = kk[0];
      if (!targetKk) {
        return reply.status(404).send({ success: false, message: "Data Kartu Keluarga tidak ditemukan." });
      }

      const existingPenduduk = await db.select().from(pendudukTable).where(eq(pendudukTable.id, pendudukId));
      const targetPenduduk = existingPenduduk[0];
      if (!targetPenduduk) {
        return reply.status(404).send({ success: false, message: "Data Penduduk tidak ditemukan." });
      }

      // Tautkan penduduk ke KK dan sinkronkan noKk serta alamatnya
      await db
        .update(pendudukTable)
        .set({
          kartuKeluargaId: id,
          noKk: targetKk.noKk,
          noKkHash: targetKk.noKkHash,
          alamat: targetKk.alamat,
          rt: targetKk.rt,
          rw: targetKk.rw,
          shdk: shdk,
          urutanKk: urutanKk || targetPenduduk.urutanKk,
        })
        .where(eq(pendudukTable.id, pendudukId));

      // Jika SHDK adalah KEPALA KELUARGA, perbarui kepalaKeluargaId pada KK
      if (shdk.toUpperCase() === "KEPALA KELUARGA") {
        await db
          .update(kartuKeluargaTable)
          .set({ kepalaKeluargaId: pendudukId })
          .where(eq(kartuKeluargaTable.id, id));
      }

      return reply.send({
        success: true,
        message: `Penduduk ${targetPenduduk.namaLengkap} berhasil ditambahkan ke Kartu Keluarga.`,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ success: false, message: "Gagal menambahkan anggota ke Kartu Keluarga." });
    }
  });

  // 6. DELETE /api/kk/:id/anggota/:pendudukId (Keluarkan Anggota dari KK)
  fastify.delete<{
    Params: { id: string; pendudukId: string };
  }>("/api/kk/:id/anggota/:pendudukId", async (request, reply) => {
    try {
      const { id, pendudukId } = request.params;

      const kk = await db.select().from(kartuKeluargaTable).where(eq(kartuKeluargaTable.id, id));
      const targetKk = kk[0];
      if (!targetKk) {
        return reply.status(404).send({ success: false, message: "Data Kartu Keluarga tidak ditemukan." });
      }

      // Lepaskan tautan KK dari penduduk
      await db
        .update(pendudukTable)
        .set({
          kartuKeluargaId: null,
          shdk: "LAINNYA",
        })
        .where(and(eq(pendudukTable.id, pendudukId), eq(pendudukTable.kartuKeluargaId, id)));

      // Jika yang dikeluarkan adalah kepala keluarga, kosongkan kepalaKeluargaId pada KK
      if (targetKk.kepalaKeluargaId === pendudukId) {
        await db
          .update(kartuKeluargaTable)
          .set({ kepalaKeluargaId: null })
          .where(eq(kartuKeluargaTable.id, id));
      }

      return reply.send({
        success: true,
        message: "Anggota keluarga berhasil dikeluarkan dari Kartu Keluarga.",
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ success: false, message: "Gagal mengeluarkan anggota dari Kartu Keluarga." });
    }
  });

  // 7. DELETE /api/kk/:id (Hapus Kartu Keluarga)
  fastify.delete<{ Params: ParamsWithId }>("/api/kk/:id", async (request, reply) => {
    try {
      const { id } = request.params;

      const deletedData = await db
        .delete(kartuKeluargaTable)
        .where(eq(kartuKeluargaTable.id, id))
        .returning();

      const deleted = deletedData[0];
      if (!deleted) {
        return reply.status(404).send({ success: false, message: "Data Kartu Keluarga tidak ditemukan." });
      }

      // Set kartuKeluargaId menjadi null pada semua anggota penduduk terkait
      await db
        .update(pendudukTable)
        .set({ kartuKeluargaId: null })
        .where(eq(pendudukTable.kartuKeluargaId, id));

      return reply.send({
        success: true,
        message: "Data Kartu Keluarga berhasil dihapus.",
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ success: false, message: "Gagal menghapus data Kartu Keluarga." });
    }
  });
}
