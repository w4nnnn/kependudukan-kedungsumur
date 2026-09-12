import type { FastifyInstance } from "fastify";
import { db } from "../db/index.js";
import { kartuKeluargaTable, pendudukTable, hashKependudukan } from "../db/schema/schema.js";
import { eq, ilike, and, or, sql, asc, desc, inArray } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth.middleware.js";
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
      const safePage = Math.max(1, parseInt(String(page), 10) || 1);
      const safeLimit = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 10));
      const offset = (safePage - 1) * safeLimit;

      const conditions = [];

      if (nokk) {
        const trimmedNokk = String(nokk).trim();
        const nokkHash = hashKependudukan(trimmedNokk);
        conditions.push(
          or(
            eq(kartuKeluargaTable.noKkHash, nokkHash),
            sql`exists (select 1 from ${pendudukTable} where ${pendudukTable.kartuKeluargaId} = ${kartuKeluargaTable.id} and ${pendudukTable.nikHash} = ${nokkHash})`
          )
        );
      }

      if (search) {
        const trimmed = String(search).trim();
        if (/^\d{16}$/.test(trimmed)) {
          const searchHash = hashKependudukan(trimmed);
          conditions.push(
            or(
              eq(kartuKeluargaTable.noKkHash, searchHash),
              sql`exists (select 1 from ${pendudukTable} where ${pendudukTable.kartuKeluargaId} = ${kartuKeluargaTable.id} and ${pendudukTable.nikHash} = ${searchHash})`,
              ilike(pendudukTable.namaLengkap, `%${trimmed}%`)
            )
          );
        } else {
          conditions.push(
            or(
              ilike(pendudukTable.namaLengkap, `%${trimmed}%`),
              sql`exists (select 1 from ${pendudukTable} where ${pendudukTable.kartuKeluargaId} = ${kartuKeluargaTable.id} and ${pendudukTable.namaLengkap} ilike ${`%${trimmed}%`})`
            )
          );
        }
      }

      const currentUser = (request as any).user;
      const effectiveRt = (currentUser?.role !== "admin" && currentUser?.rt) ? currentUser.rt : rt;
      const effectiveRw = (currentUser?.role !== "admin" && currentUser?.rw) ? currentUser.rw : rw;

      if (effectiveRt) {
        conditions.push(eq(kartuKeluargaTable.rt, effectiveRt));
      }

      if (effectiveRw) {
        conditions.push(eq(kartuKeluargaTable.rw, effectiveRw));
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
          .limit(safeLimit)
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
          .orderBy(
            asc(sql`cast(coalesce(nullif(regexp_replace(${pendudukTable.urutanKk}, '\\D', '', 'g'), ''), '999') as integer)`),
            asc(pendudukTable.createdAt)
          );

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
      const totalPages = Math.max(1, Math.ceil(total / safeLimit));

      return reply.send({
        success: true,
        data: result,
        meta: {
          total,
          page: safePage,
          limit: safeLimit,
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

      const currentUser = (request as any).user;
      if (currentUser?.role !== "admin" && currentUser?.rt && record.rt !== currentUser.rt) {
        return reply.status(403).send({ success: false, message: `Akses ditolak. Anda hanya berwenang untuk wilayah RT ${currentUser.rt}.` });
      }
      if (currentUser?.role !== "admin" && currentUser?.rw && record.rw !== currentUser.rw) {
        return reply.status(403).send({ success: false, message: `Akses ditolak. Anda hanya berwenang untuk wilayah RW ${currentUser.rw}.` });
      }

      const anggota = await db
        .select()
        .from(pendudukTable)
        .where(eq(pendudukTable.kartuKeluargaId, id))
        .orderBy(
          asc(sql`cast(coalesce(nullif(regexp_replace(${pendudukTable.urutanKk}, '\\D', '', 'g'), ''), '999') as integer)`),
          asc(pendudukTable.createdAt)
        );

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

      if (!body.noKk || !/^\d{16}$/.test(body.noKk)) {
        return reply.status(400).send({ success: false, message: "Nomor KK harus 16 digit angka." });
      }

      if (!body.alamat || !body.rt || !body.rw) {
        return reply.status(400).send({ success: false, message: "Alamat, RT, dan RW Kartu Keluarga wajib diisi." });
      }

      const currentUser = (request as any).user;
      if (currentUser?.role !== "admin" && currentUser?.rt && body.rt !== currentUser.rt) {
        return reply.status(403).send({ success: false, message: `Akses ditolak. Anda hanya berwenang untuk wilayah RT ${currentUser.rt}.` });
      }
      if (currentUser?.role !== "admin" && currentUser?.rw && body.rw !== currentUser.rw) {
        return reply.status(403).send({ success: false, message: `Akses ditolak. Anda hanya berwenang untuk wilayah RW ${currentUser.rw}.` });
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
          const [targetPenduduk] = await tx
            .select()
            .from(pendudukTable)
            .where(eq(pendudukTable.id, selectedPendudukId));

          if (!targetPenduduk) {
            throw { statusCode: 400, message: "Penduduk yang dipilih sebagai Kepala Keluarga tidak ditemukan." };
          }

          if (currentUser?.role !== "admin" && currentUser?.rt && targetPenduduk.rt !== currentUser.rt) {
            throw { statusCode: 403, message: `Akses ditolak. Penduduk yang dipilih berada di luar wilayah RT ${currentUser.rt}.` };
          }
          if (currentUser?.role !== "admin" && currentUser?.rw && targetPenduduk.rw !== currentUser.rw) {
            throw { statusCode: 403, message: `Akses ditolak. Penduduk yang dipilih berada di luar wilayah RW ${currentUser.rw}.` };
          }

          kepalaId = selectedPendudukId;

          await tx
            .update(kartuKeluargaTable)
            .set({ kepalaKeluargaId: null })
            .where(
              and(
                eq(kartuKeluargaTable.kepalaKeluargaId, selectedPendudukId),
                sql`${kartuKeluargaTable.id} != ${createdKK.id}`
              )
            );

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
  fastify.put<{
    Params: ParamsWithId;
    Body: Partial<KartuKeluargaInsert> & { kepalaKeluargaId?: string | null };
  }>("/api/kk/:id", async (request, reply) => {
    try {
      const { id } = request.params;
      const { kepalaKeluargaId, ...body } = (request.body || {}) as any;

      if (body.noKk !== undefined) {
        if (!body.noKk || !/^\d{16}$/.test(body.noKk)) {
          return reply.status(400).send({ success: false, message: "Nomor KK harus 16 digit angka." });
        }
      }

      const updated = await db.transaction(async (tx) => {
        const existingKk = await tx
          .select()
          .from(kartuKeluargaTable)
          .where(eq(kartuKeluargaTable.id, id));

        const currentKk = existingKk[0];
        if (!currentKk) {
          throw { statusCode: 404, message: "Data Kartu Keluarga tidak ditemukan." };
        }

        const currentUser = (request as any).user;
        if (currentUser?.role !== "admin" && currentUser?.rt && currentKk.rt !== currentUser.rt) {
          throw { statusCode: 403, message: "Akses ditolak. Anda tidak memiliki izin untuk mengubah data di luar RT Anda." };
        }
        if (currentUser?.role !== "admin" && currentUser?.rw && currentKk.rw !== currentUser.rw) {
          throw { statusCode: 403, message: "Akses ditolak. Anda tidak memiliki izin untuk mengubah data di luar RW Anda." };
        }
        if (currentUser?.role !== "admin" && currentUser?.rt && body.rt && body.rt !== currentUser.rt) {
          throw { statusCode: 403, message: `Akses ditolak. Anda hanya berwenang untuk wilayah RT ${currentUser.rt}.` };
        }
        if (currentUser?.role !== "admin" && currentUser?.rw && body.rw && body.rw !== currentUser.rw) {
          throw { statusCode: 403, message: `Akses ditolak. Anda hanya berwenang untuk wilayah RW ${currentUser.rw}.` };
        }

        const updatePayload: Partial<KartuKeluargaInsert> = { ...body };
        delete (updatePayload as any).id;
        delete (updatePayload as any).createdAt;
        delete (updatePayload as any).updatedAt;
        updatePayload.updatedAt = new Date();

        if (body.noKk) {
          const newNoKkHash = hashKependudukan(body.noKk);
          const duplicate = await tx
            .select()
            .from(kartuKeluargaTable)
            .where(
              and(
                eq(kartuKeluargaTable.noKkHash, newNoKkHash),
                sql`${kartuKeluargaTable.id} != ${id}`
              )
            );

          if (duplicate.length > 0) {
            throw { statusCode: 400, message: "Nomor KK sudah terdaftar." };
          }
          updatePayload.noKkHash = newNoKkHash;
        }

        if (kepalaKeluargaId !== undefined) {
          if (kepalaKeluargaId) {
            const [targetMember] = await tx
              .select()
              .from(pendudukTable)
              .where(eq(pendudukTable.id, kepalaKeluargaId));

            if (!targetMember) {
              throw { statusCode: 400, message: "Penduduk yang dipilih sebagai Kepala Keluarga tidak ditemukan." };
            }

            if (currentUser?.role !== "admin" && currentUser?.rt && targetMember.rt !== currentUser.rt) {
              throw { statusCode: 403, message: `Akses ditolak. Penduduk yang dipilih berada di luar wilayah RT ${currentUser.rt}.` };
            }
            if (currentUser?.role !== "admin" && currentUser?.rw && targetMember.rw !== currentUser.rw) {
              throw { statusCode: 403, message: `Akses ditolak. Penduduk yang dipilih berada di luar wilayah RW ${currentUser.rw}.` };
            }

            updatePayload.kepalaKeluargaId = kepalaKeluargaId;

            await tx
              .update(pendudukTable)
              .set({ shdk: "ANGGOTA KELUARGA" })
              .where(
                and(
                  eq(pendudukTable.kartuKeluargaId, id),
                  eq(pendudukTable.shdk, "KEPALA KELUARGA"),
                  sql`${pendudukTable.id} != ${kepalaKeluargaId}`
                )
              );

            await tx
              .update(kartuKeluargaTable)
              .set({ kepalaKeluargaId: null })
              .where(
                and(
                  eq(kartuKeluargaTable.kepalaKeluargaId, kepalaKeluargaId),
                  sql`${kartuKeluargaTable.id} != ${id}`
                )
              );

            await tx
              .update(pendudukTable)
              .set({
                kartuKeluargaId: id,
                noKk: body.noKk || currentKk.noKk,
                noKkHash: updatePayload.noKkHash || currentKk.noKkHash,
                shdk: "KEPALA KELUARGA",
              })
              .where(eq(pendudukTable.id, kepalaKeluargaId));
          } else {
            updatePayload.kepalaKeluargaId = null;
            await tx
              .update(pendudukTable)
              .set({ shdk: "ANGGOTA KELUARGA" })
              .where(
                and(
                  eq(pendudukTable.kartuKeluargaId, id),
                  eq(pendudukTable.shdk, "KEPALA KELUARGA")
                )
              );
          }
        }

        const updatedData = await tx
          .update(kartuKeluargaTable)
          .set(updatePayload)
          .where(eq(kartuKeluargaTable.id, id))
          .returning();

        const updatedRecord = updatedData[0];
        if (!updatedRecord) {
          throw { statusCode: 500, message: "Gagal memperbarui data Kartu Keluarga." };
        }

        if (body.alamat || body.rt || body.rw || body.noKk) {
          const syncPayload: any = {};
          if (body.alamat) syncPayload.alamat = body.alamat;
          if (body.rt) syncPayload.rt = body.rt;
          if (body.rw) syncPayload.rw = body.rw;
          if (body.noKk) {
            syncPayload.noKk = body.noKk;
            syncPayload.noKkHash = hashKependudukan(body.noKk);
          }

          await tx
            .update(pendudukTable)
            .set(syncPayload)
            .where(eq(pendudukTable.kartuKeluargaId, id));
        }

        return updatedRecord;
      });

      return reply.send({
        success: true,
        message: "Data Kartu Keluarga berhasil diperbarui.",
        data: updated,
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

      const result = await db.transaction(async (tx) => {
        const kk = await tx.select().from(kartuKeluargaTable).where(eq(kartuKeluargaTable.id, id));
        const targetKk = kk[0];
        if (!targetKk) {
          throw { statusCode: 404, message: "Data Kartu Keluarga tidak ditemukan." };
        }

        const currentUser = (request as any).user;
        if (currentUser?.role !== "admin" && currentUser?.rt && targetKk.rt !== currentUser.rt) {
          throw { statusCode: 403, message: `Akses ditolak. Anda hanya berwenang untuk wilayah RT ${currentUser.rt}.` };
        }
        if (currentUser?.role !== "admin" && currentUser?.rw && targetKk.rw !== currentUser.rw) {
          throw { statusCode: 403, message: `Akses ditolak. Anda hanya berwenang untuk wilayah RW ${currentUser.rw}.` };
        }

        const [existingCount] = await tx
          .select({ count: sql<number>`cast(count(${pendudukTable.id}) as integer)` })
          .from(pendudukTable)
          .where(eq(pendudukTable.kartuKeluargaId, id));
        const autoUrutan = String((existingCount?.count ?? 0) + 1);

        if (mode === "create" || (!pendudukId && penduduk)) {
          if (!penduduk) {
            throw { statusCode: 400, message: "Data penduduk baru wajib disertakan." };
          }
          if (!penduduk.nik || penduduk.nik.length !== 16 || !/^\d{16}$/.test(penduduk.nik)) {
            throw { statusCode: 400, message: "NIK harus 16 digit angka." };
          }
          if (!penduduk.namaLengkap || penduduk.namaLengkap.trim().length < 3) {
            throw { statusCode: 400, message: "Nama lengkap minimal 3 karakter." };
          }
          if (!penduduk.tanggalLahir) {
            throw { statusCode: 400, message: "Tanggal lahir wajib diisi." };
          }

          const nikHash = hashKependudukan(penduduk.nik);
          const existing = await tx.select().from(pendudukTable).where(eq(pendudukTable.nikHash, nikHash));
          if (existing.length > 0) {
            throw { statusCode: 400, message: "NIK sudah terdaftar." };
          }

          const [createdPenduduk] = await tx
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
              urutanKk: urutanKk || autoUrutan,
            })
            .returning();

          if (!createdPenduduk) {
            throw { statusCode: 500, message: "Gagal membuat data penduduk baru." };
          }

          if (shdk.toUpperCase() === "KEPALA KELUARGA") {
            await tx
              .update(pendudukTable)
              .set({ shdk: "ANGGOTA KELUARGA" })
              .where(
                and(
                  eq(pendudukTable.kartuKeluargaId, id),
                  eq(pendudukTable.shdk, "KEPALA KELUARGA"),
                  sql`${pendudukTable.id} != ${createdPenduduk.id}`
                )
              );

            await tx
              .update(kartuKeluargaTable)
              .set({ kepalaKeluargaId: createdPenduduk.id })
              .where(eq(kartuKeluargaTable.id, id));
          }

          return { isCreate: true, record: createdPenduduk };
        }

        if (!pendudukId) {
          throw { statusCode: 400, message: "Penduduk ID wajib disertakan." };
        }

        const existingPenduduk = await tx.select().from(pendudukTable).where(eq(pendudukTable.id, pendudukId));
        const targetPenduduk = existingPenduduk[0];
        if (!targetPenduduk) {
          throw { statusCode: 404, message: "Data Penduduk tidak ditemukan." };
        }

        if (currentUser?.role !== "admin" && currentUser?.rt && targetPenduduk.rt !== currentUser.rt) {
          throw { statusCode: 403, message: `Akses ditolak. Penduduk yang dipilih berada di luar wilayah RT ${currentUser.rt}.` };
        }
        if (currentUser?.role !== "admin" && currentUser?.rw && targetPenduduk.rw !== currentUser.rw) {
          throw { statusCode: 403, message: `Akses ditolak. Penduduk yang dipilih berada di luar wilayah RW ${currentUser.rw}.` };
        }

        await tx
          .update(kartuKeluargaTable)
          .set({ kepalaKeluargaId: null })
          .where(
            and(
              eq(kartuKeluargaTable.kepalaKeluargaId, pendudukId),
              sql`${kartuKeluargaTable.id} != ${id}`
            )
          );

        const [updatedPenduduk] = await tx
          .update(pendudukTable)
          .set({
            kartuKeluargaId: id,
            noKk: targetKk.noKk,
            noKkHash: targetKk.noKkHash,
            alamat: targetKk.alamat,
            rt: targetKk.rt,
            rw: targetKk.rw,
            shdk: shdk,
            urutanKk: urutanKk || (targetPenduduk.kartuKeluargaId === id ? targetPenduduk.urutanKk : autoUrutan),
          })
          .where(eq(pendudukTable.id, pendudukId))
          .returning();

        if (shdk.toUpperCase() === "KEPALA KELUARGA") {
          await tx
            .update(pendudukTable)
            .set({ shdk: "ANGGOTA KELUARGA" })
            .where(
              and(
                eq(pendudukTable.kartuKeluargaId, id),
                eq(pendudukTable.shdk, "KEPALA KELUARGA"),
                sql`${pendudukTable.id} != ${pendudukId}`
              )
            );

          await tx
            .update(kartuKeluargaTable)
            .set({ kepalaKeluargaId: pendudukId })
            .where(eq(kartuKeluargaTable.id, id));
        }

        return { isCreate: false, record: updatedPenduduk || targetPenduduk };
      });

      if (result.isCreate) {
        return reply.status(201).send({
          success: true,
          message: `Penduduk ${result.record.namaLengkap} berhasil ditambahkan ke Kartu Keluarga.`,
          data: withFotoUrl(result.record),
        });
      }

      return reply.send({
        success: true,
        message: `Penduduk ${result.record.namaLengkap} berhasil ditambahkan ke Kartu Keluarga.`,
        data: withFotoUrl(result.record),
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

      const currentUser = (request as any).user;
      if (currentUser?.role !== "admin" && currentUser?.rt && targetKk.rt !== currentUser.rt) {
        return reply.status(403).send({ success: false, message: `Akses ditolak. Anda hanya berwenang untuk wilayah RT ${currentUser.rt}.` });
      }
      if (currentUser?.role !== "admin" && currentUser?.rw && targetKk.rw !== currentUser.rw) {
        return reply.status(403).send({ success: false, message: `Akses ditolak. Anda hanya berwenang untuk wilayah RW ${currentUser.rw}.` });
      }

      await db.transaction(async (tx) => {
        const existingMember = await tx
          .select()
          .from(pendudukTable)
          .where(and(eq(pendudukTable.id, pendudukId), eq(pendudukTable.kartuKeluargaId, id)));

        if (!existingMember[0]) {
          throw { statusCode: 404, message: "Data anggota keluarga tidak ditemukan dalam KK ini." };
        }

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
    } catch (error: any) {
      if (error?.statusCode && error?.message) {
        return reply.status(error.statusCode).send({ success: false, message: error.message });
      }
      fastify.log.error(error);
      return reply.status(500).send({ success: false, message: "Gagal mengeluarkan anggota dari Kartu Keluarga." });
    }
  });

  // 7. DELETE /api/kk/:id (Hapus Kartu Keluarga)
  fastify.delete<{ Params: ParamsWithId }>("/api/kk/:id", { preHandler: requireAdmin }, async (request, reply) => {
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
