import type { FastifyInstance } from "fastify";
import { db } from "../db/index.js";
import { kartuKeluargaTable, pendudukTable, hashKependudukan } from "../db/schema/schema.js";
import { eq, ilike, and, or, sql, asc, desc, inArray } from "drizzle-orm";
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

      if (search) {
        const trimmed = String(search).trim();
        if (/^\d{16}$/.test(trimmed)) {
          conditions.push(
            or(
              eq(kartuKeluargaTable.noKkHash, hashKependudukan(trimmed)),
              ilike(pendudukTable.namaLengkap, `%${trimmed}%`)
            )
          );
        } else {
          conditions.push(ilike(pendudukTable.namaLengkap, `%${trimmed}%`));
        }
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

      let query = db
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
        .$dynamic();

      let countQuery = db
        .select({ count: sql<number>`cast(count(${kartuKeluargaTable.id}) as integer)` })
        .from(kartuKeluargaTable)
        .leftJoin(pendudukTable, eq(kartuKeluargaTable.kepalaKeluargaId, pendudukTable.id))
        .$dynamic();

      if (conditions.length > 0) {
        const whereCondition = and(...conditions);
        query = query.where(whereCondition);
        countQuery = countQuery.where(whereCondition);
      }

      const [kkList, totalCount] = await Promise.all([
        query
          .orderBy(desc(kartuKeluargaTable.createdAt))
          .limit(Number(limit))
          .offset(offset),
        countQuery,
      ]);

      const kkIds = kkList.map((k) => k.id);
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
          .where(inArray(pendudukTable.kartuKeluargaId, kkIds))
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

      const result = kkList.map((kk) => ({
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

  fastify.post<{
    Body: KartuKeluargaInsert & {
      modeKepala?: "select" | "create";
      selectedPendudukId?: string;
      newPenduduk?: {
        nik: string;
        namaLengkap: string;
        tempatLahir: string;
        tanggalLahir: string;
        jenisKelamin: string;
        agama: string;
        statusPerkawinan: string;
        pekerjaan?: string;
      };
      createKepalaKeluarga?: {
        nik: string;
        namaLengkap: string;
        tempatLahir: string;
        tanggalLahir: string;
        jenisKelamin: string;
        agama: string;
        statusPerkawinan: string;
        pekerjaan?: string;
      };
    };
  }>("/api/kk", async (request, reply) => {
    try {
      const {
        modeKepala: reqModeKepala,
        selectedPendudukId: reqSelectedPendudukId,
        newPenduduk: reqNewPenduduk,
        createKepalaKeluarga,
        ...restBody
      } = request.body as any;

      const effectiveNewPenduduk = reqNewPenduduk || createKepalaKeluarga;
      const effectiveSelectedPendudukId = reqSelectedPendudukId || restBody.kepalaKeluargaId;
      const modeKepala = reqModeKepala || (effectiveNewPenduduk ? "create" : effectiveSelectedPendudukId ? "select" : undefined);
      const selectedPendudukId = effectiveSelectedPendudukId;
      const newPenduduk = effectiveNewPenduduk;

      const { kepalaKeluargaId: _discardKepalaId, ...body } = restBody;

      if (!body.noKk) {
        return reply.status(400).send({ success: false, message: "Nomor KK wajib diisi." });
      }

      const noKkHash = hashKependudukan(body.noKk);

      const result = await db.transaction(async (tx) => {
        const existing = await tx
          .select()
          .from(kartuKeluargaTable)
          .where(eq(kartuKeluargaTable.noKkHash, noKkHash));

        if (existing.length > 0) {
          throw { statusCode: 400, message: "Nomor KK sudah terdaftar." };
        }

        const newKK = await tx
          .insert(kartuKeluargaTable)
          .values({
            ...body,
            noKkHash,
          })
          .returning();

        const createdKK = newKK[0];
        if (!createdKK) {
          throw { statusCode: 500, message: "Gagal membuat data Kartu Keluarga." };
        }

        let kepalaId: string | null = null;

        if (modeKepala === "select" && selectedPendudukId) {
          kepalaId = selectedPendudukId;
          await tx
            .update(pendudukTable)
            .set({
              kartuKeluargaId: createdKK.id,
              noKk: createdKK.noKk,
              noKkHash: createdKK.noKkHash,
              alamat: createdKK.alamat,
              rt: createdKK.rt,
              rw: createdKK.rw,
              shdk: "KEPALA KELUARGA",
              urutanKk: "1",
            })
            .where(eq(pendudukTable.id, selectedPendudukId));
        } else if (modeKepala === "create" && newPenduduk && newPenduduk.nik && newPenduduk.namaLengkap) {
          const nikHash = hashKependudukan(newPenduduk.nik);
          const [insertedPenduduk] = await tx
            .insert(pendudukTable)
            .values({
              ...newPenduduk,
              kartuKeluargaId: createdKK.id,
              nikHash,
              noKk: createdKK.noKk,
              noKkHash: createdKK.noKkHash,
              alamat: createdKK.alamat,
              rt: createdKK.rt,
              rw: createdKK.rw,
              shdk: "KEPALA KELUARGA",
              urutanKk: "1",
            })
            .returning();

          if (insertedPenduduk) {
            kepalaId = insertedPenduduk.id;
          }
        }

        if (kepalaId) {
          const [updatedKK] = await tx
            .update(kartuKeluargaTable)
            .set({ kepalaKeluargaId: kepalaId })
            .where(eq(kartuKeluargaTable.id, createdKK.id))
            .returning();
          return updatedKK || { ...createdKK, kepalaKeluargaId: kepalaId };
        }

        return createdKK;
      });

      return reply.status(201).send({
        success: true,
        message: "Data Kartu Keluarga berhasil ditambahkan.",
        data: result,
      });
    } catch (error: any) {
      if (error?.statusCode && error?.message) {
        return reply.status(error.statusCode).send({ success: false, message: error.message });
      }
      fastify.log.error(error);
      const isUniqueViolation =
        error?.code === "23505" ||
        error?.cause?.code === "23505" ||
        error?.message?.includes("duplicate key") ||
        error?.cause?.message?.includes("duplicate key");

      if (isUniqueViolation) {
        return reply.status(400).send({ success: false, message: "Nomor KK atau NIK sudah terdaftar." });
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
    Body: {
      mode?: "select" | "create";
      pendudukId?: string;
      shdk?: string;
      urutanKk?: string;
      penduduk?: {
        nik: string;
        namaLengkap: string;
        tempatLahir: string;
        tanggalLahir: string;
        jenisKelamin: string;
        agama: string;
        statusPerkawinan: string;
        pekerjaan?: string;
        namaAyah?: string;
        namaIbu?: string;
        pendidikan?: string;
        golonganDarah?: string;
      };
    };
  }>("/api/kk/:id/anggota", async (request, reply) => {
    try {
      const { id } = request.params;
      const { mode = "select", pendudukId, shdk = "ANGGOTA KELUARGA", urutanKk, penduduk } = request.body;

      const kk = await db.select().from(kartuKeluargaTable).where(eq(kartuKeluargaTable.id, id));
      const targetKk = kk[0];
      if (!targetKk) {
        return reply.status(404).send({ success: false, message: "Data Kartu Keluarga tidak ditemukan." });
      }

      if (mode === "create" || (!pendudukId && penduduk)) {
        if (!penduduk) {
          return reply.status(400).send({ success: false, message: "Data penduduk baru wajib disertakan." });
        }
        if (!penduduk.nik || penduduk.nik.length !== 16 || !/^\d{16}$/.test(penduduk.nik)) {
          return reply.status(400).send({ success: false, message: "NIK harus 16 digit angka." });
        }
        if (!penduduk.namaLengkap || penduduk.namaLengkap.trim().length < 3) {
          return reply.status(400).send({ success: false, message: "Nama lengkap minimal 3 karakter." });
        }
        if (!penduduk.tanggalLahir) {
          return reply.status(400).send({ success: false, message: "Tanggal lahir wajib diisi." });
        }

        const nikHash = hashKependudukan(penduduk.nik);
        const existing = await db.select().from(pendudukTable).where(eq(pendudukTable.nikHash, nikHash));
        if (existing.length > 0) {
          return reply.status(400).send({ success: false, message: "NIK sudah terdaftar." });
        }

        const [createdPenduduk] = await db
          .insert(pendudukTable)
          .values({
            ...penduduk,
            kartuKeluargaId: id,
            nikHash,
            noKk: targetKk.noKk,
            noKkHash: targetKk.noKkHash,
            alamat: targetKk.alamat,
            rt: targetKk.rt,
            rw: targetKk.rw,
            shdk: shdk,
            urutanKk: urutanKk || "1",
          })
          .returning();

        if (!createdPenduduk) {
          return reply.status(500).send({ success: false, message: "Gagal membuat data penduduk baru." });
        }

        if (shdk.toUpperCase() === "KEPALA KELUARGA") {
          await db
            .update(kartuKeluargaTable)
            .set({ kepalaKeluargaId: createdPenduduk.id })
            .where(eq(kartuKeluargaTable.id, id));
        }

        return reply.status(201).send({
          success: true,
          message: `Penduduk ${createdPenduduk.namaLengkap} berhasil ditambahkan ke Kartu Keluarga.`,
          data: withFotoUrl(createdPenduduk),
        });
      }

      if (!pendudukId) {
        return reply.status(400).send({ success: false, message: "Penduduk ID wajib disertakan." });
      }

      const existingPenduduk = await db.select().from(pendudukTable).where(eq(pendudukTable.id, pendudukId));
      const targetPenduduk = existingPenduduk[0];
      if (!targetPenduduk) {
        return reply.status(404).send({ success: false, message: "Data Penduduk tidak ditemukan." });
      }

      // Tautkan penduduk ke KK dan sinkronkan noKk serta alamatnya
      const [updatedPenduduk] = await db
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
        .where(eq(pendudukTable.id, pendudukId))
        .returning();

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
        data: withFotoUrl(updatedPenduduk || targetPenduduk),
      });
    } catch (error: any) {
      fastify.log.error(error);
      const isUniqueViolation =
        error?.code === "23505" ||
        error?.cause?.code === "23505" ||
        error?.message?.includes("duplicate key") ||
        error?.cause?.message?.includes("duplicate key");

      if (isUniqueViolation) {
        return reply.status(400).send({ success: false, message: "NIK sudah terdaftar." });
      }
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

      await db.transaction(async (tx) => {
        await tx
          .update(pendudukTable)
          .set({
            kartuKeluargaId: null,
            noKk: "-",
            noKkHash: hashKependudukan("-"),
            shdk: "LAINNYA",
          })
          .where(and(eq(pendudukTable.id, pendudukId), eq(pendudukTable.kartuKeluargaId, id)));

        if (targetKk.kepalaKeluargaId === pendudukId) {
          await tx
            .update(kartuKeluargaTable)
            .set({ kepalaKeluargaId: null })
            .where(eq(kartuKeluargaTable.id, id));
        }
      });

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

      const deleted = await db.transaction(async (tx) => {
        await tx
          .update(pendudukTable)
          .set({
            kartuKeluargaId: null,
            noKk: "-",
            noKkHash: hashKependudukan("-"),
            shdk: "LAINNYA",
          })
          .where(eq(pendudukTable.kartuKeluargaId, id));

        const deletedData = await tx
          .delete(kartuKeluargaTable)
          .where(eq(kartuKeluargaTable.id, id))
          .returning();

        return deletedData[0];
      });

      if (!deleted) {
        return reply.status(404).send({ success: false, message: "Data Kartu Keluarga tidak ditemukan." });
      }

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
