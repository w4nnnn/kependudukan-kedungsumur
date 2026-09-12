import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { db } from "../db/index.js";
import { pendudukTable, kartuKeluargaTable, hashKependudukan } from "../db/schema/schema.js";
import { eq, ilike, and, or, sql, desc, asc } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth.middleware.js";
import { uploadFotoPenduduk, deleteFotoPenduduk, getPublicFotoUrl, getFotoStream } from "../lib/minio.js";
import path from "path";

type PendudukInsert = typeof pendudukTable.$inferInsert;
type ParamsWithId = { id: string };

function withFotoUrl<T extends { foto?: string | null }>(item: T | undefined | null) {
  if (!item) return null;
  return {
    ...item,
    fotoUrl: getPublicFotoUrl(item.foto),
  };
}

export default async function pendudukRoutes(fastify: FastifyInstance) {
  
  fastify.addHook("preHandler", requireAuth);

  fastify.get("/api/penduduk", async (request, reply) => {
    try {
      const { search, nik, nokk, kkId, rt, rw, limit = 100, page = 1 } = request.query as any;
      const safePage = Math.max(1, parseInt(String(page), 10) || 1);
      const safeLimit = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 10));
      const offset = (safePage - 1) * safeLimit;

      let query = db.select().from(pendudukTable).$dynamic();
      let countQuery = db.select({ count: sql<number>`cast(count(${pendudukTable.id}) as integer)` }).from(pendudukTable).$dynamic();

      const conditions = [];

      if (search) {
        const trimmed = String(search).trim();
        if (/^\d{16}$/.test(trimmed)) {
          const searchHash = hashKependudukan(trimmed);
          conditions.push(
            or(
              eq(pendudukTable.nikHash, searchHash),
              eq(pendudukTable.noKkHash, searchHash)
            )
          );
        } else {
          conditions.push(ilike(pendudukTable.namaLengkap, `%${trimmed}%`));
        }
      }
      
      if (nik) {
        const trimmedNik = String(nik).trim();
        conditions.push(eq(pendudukTable.nikHash, hashKependudukan(trimmedNik)));
      }

      if (nokk) {
        const trimmedNokk = String(nokk).trim();
        conditions.push(eq(pendudukTable.noKkHash, hashKependudukan(trimmedNokk)));
      }

      if (kkId) {
        conditions.push(eq(pendudukTable.kartuKeluargaId, kkId));
      }

      const currentUser = (request as any).user;
      const effectiveRt = (currentUser?.role !== "admin" && currentUser?.rt) ? currentUser.rt : rt;
      const effectiveRw = (currentUser?.role !== "admin" && currentUser?.rw) ? currentUser.rw : rw;

      if (effectiveRt) {
        conditions.push(eq(pendudukTable.rt, effectiveRt));
      }

      if (effectiveRw) {
        conditions.push(eq(pendudukTable.rw, effectiveRw));
      }

      if (conditions.length > 0) {
        const whereCondition = and(...conditions);
        query = query.where(whereCondition);
        countQuery = countQuery.where(whereCondition);
      }

      const [data, totalCount] = await Promise.all([
        query.orderBy(desc(pendudukTable.createdAt)).limit(safeLimit).offset(offset),
        countQuery
      ]);

      const total = totalCount[0]?.count ?? 0;
      const totalPages = Math.max(1, Math.ceil(total / safeLimit));

      return reply.send({ 
        success: true, 
        data: data.map(withFotoUrl),
        meta: {
          total,
          page: safePage,
          limit: safeLimit,
          totalPages
        }
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ success: false, message: "Gagal mengambil data." });
    }
  });

  fastify.get<{ Params: ParamsWithId }>("/api/penduduk/:id", async (request, reply) => {
    try {
      const { id } = request.params;
      const data = await db.select().from(pendudukTable).where(eq(pendudukTable.id, id));
      const record = data[0];
      
      if (!record) {
        return reply.status(404).send({ success: false, message: "Data penduduk tidak ditemukan." });
      }

      const currentUser = (request as any).user;
      if (currentUser?.role !== "admin" && currentUser?.rt && record.rt !== currentUser.rt) {
        return reply.status(403).send({ success: false, message: `Akses ditolak. Anda hanya berwenang untuk wilayah RT ${currentUser.rt}.` });
      }
      if (currentUser?.role !== "admin" && currentUser?.rw && record.rw !== currentUser.rw) {
        return reply.status(403).send({ success: false, message: `Akses ditolak. Anda hanya berwenang untuk wilayah RW ${currentUser.rw}.` });
      }

      let kartuKeluarga = null;
      let anggotaKeluarga: any[] = [];

      if (record.kartuKeluargaId) {
        const kkData = await db
          .select()
          .from(kartuKeluargaTable)
          .where(eq(kartuKeluargaTable.id, record.kartuKeluargaId));
        
        if (kkData[0]) {
          const anggota = await db
            .select({
              id: pendudukTable.id,
              namaLengkap: pendudukTable.namaLengkap,
              nik: pendudukTable.nik,
              shdk: pendudukTable.shdk,
              urutanKk: pendudukTable.urutanKk,
              jenisKelamin: pendudukTable.jenisKelamin,
              foto: pendudukTable.foto,
            })
            .from(pendudukTable)
            .where(eq(pendudukTable.kartuKeluargaId, record.kartuKeluargaId))
            .orderBy(
              asc(sql`cast(coalesce(nullif(regexp_replace(${pendudukTable.urutanKk}, '\\D', '', 'g'), ''), '999') as integer)`),
              asc(pendudukTable.createdAt)
            );

          kartuKeluarga = kkData[0];
          anggotaKeluarga = anggota.map(withFotoUrl);
        }
      }

      return reply.send({ 
        success: true, 
        data: {
          ...withFotoUrl(record),
          kartuKeluarga,
          anggotaKeluarga,
        }
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ success: false, message: "Gagal mengambil data." });
    }
  });

  fastify.post<{
    Body: PendudukInsert & {
      createKk?: {
        noKk: string;
        alamat: string;
        rt: string;
        rw: string;
        dusun?: string;
        kodePos?: string;
        tanggalDikeluarkan?: string;
      };
    };
  }>("/api/penduduk", async (request, reply) => {
    try {
      const { createKk, ...body } = request.body as any;

      if (!body.nik || !/^\d{16}$/.test(body.nik)) {
        return reply.status(400).send({ success: false, message: "NIK harus 16 digit angka." });
      }

      if (body.noKk && body.noKk !== "-" && !/^\d{16}$/.test(body.noKk)) {
        return reply.status(400).send({ success: false, message: "Nomor KK harus 16 digit angka atau '-'." });
      }

      if (createKk && (!createKk.noKk || !/^\d{16}$/.test(createKk.noKk))) {
        return reply.status(400).send({ success: false, message: "Nomor KK harus 16 digit." });
      }

      if (
        !body.namaLengkap ||
        !body.tempatLahir ||
        !body.tanggalLahir ||
        !body.jenisKelamin ||
        !body.alamat ||
        !body.rt ||
        !body.rw ||
        !body.agama ||
        !body.statusPerkawinan
      ) {
        return reply.status(400).send({
          success: false,
          message: "Data wajib tidak lengkap (Nama, Tempat/Tgl Lahir, Jenis Kelamin, Alamat, RT/RW, Agama, Status Perkawinan wajib diisi).",
        });
      }

      const currentUser = (request as any).user;
      if (currentUser?.role !== "admin" && currentUser?.rt && body.rt !== currentUser.rt) {
        return reply.status(403).send({ success: false, message: `Akses ditolak. Anda hanya berwenang untuk wilayah RT ${currentUser.rt}.` });
      }
      if (currentUser?.role !== "admin" && currentUser?.rw && body.rw !== currentUser.rw) {
        return reply.status(403).send({ success: false, message: `Akses ditolak. Anda hanya berwenang untuk wilayah RW ${currentUser.rw}.` });
      }

      const created = await db.transaction(async (tx) => {
        let kartuKeluargaId = body.kartuKeluargaId;
        let noKk = body.noKk;

        if (createKk) {
          noKk = createKk.noKk;
          const newKkHash = hashKependudukan(createKk.noKk);

          const existingKk = await tx
            .select()
            .from(kartuKeluargaTable)
            .where(eq(kartuKeluargaTable.noKkHash, newKkHash));
          if (existingKk.length > 0) {
            throw { statusCode: 400, message: "Nomor KK sudah terdaftar." };
          }

          const insertedKk = await tx
            .insert(kartuKeluargaTable)
            .values({
              noKk: createKk.noKk,
              noKkHash: newKkHash,
              alamat: createKk.alamat || body.alamat,
              rt: createKk.rt || body.rt,
              rw: createKk.rw || body.rw,
              dusun: createKk.dusun || null,
              kodePos: createKk.kodePos || null,
              tanggalDikeluarkan: createKk.tanggalDikeluarkan || null,
            })
            .returning();

          if (!insertedKk[0]) {
            throw { statusCode: 500, message: "Gagal membuat data Kartu Keluarga." };
          }
          kartuKeluargaId = insertedKk[0].id;
        }

        if (!kartuKeluargaId && noKk && noKk !== "-") {
          const checkHash = hashKependudukan(noKk);
          const existingKk = await tx
            .select()
            .from(kartuKeluargaTable)
            .where(eq(kartuKeluargaTable.noKkHash, checkHash));
          if (existingKk[0]) {
            if (currentUser?.role !== "admin" && currentUser?.rt && existingKk[0].rt !== currentUser.rt) {
              throw { statusCode: 403, message: `Akses ditolak. Kartu Keluarga dengan No. KK tersebut berada di luar wilayah RT ${currentUser.rt}.` };
            }
            if (currentUser?.role !== "admin" && currentUser?.rw && existingKk[0].rw !== currentUser.rw) {
              throw { statusCode: 403, message: `Akses ditolak. Kartu Keluarga dengan No. KK tersebut berada di luar wilayah RW ${currentUser.rw}.` };
            }
            kartuKeluargaId = existingKk[0].id;
          }
        }

        if (kartuKeluargaId) {
          const targetKk = await tx
            .select()
            .from(kartuKeluargaTable)
            .where(eq(kartuKeluargaTable.id, kartuKeluargaId));

          if (!targetKk[0]) {
            throw { statusCode: 400, message: "Data Kartu Keluarga tidak ditemukan." };
          }

          if (currentUser?.role !== "admin" && currentUser?.rt && targetKk[0].rt !== currentUser.rt) {
            throw { statusCode: 403, message: `Akses ditolak. Kartu Keluarga tujuan berada di luar wilayah RT ${currentUser.rt}.` };
          }
          if (currentUser?.role !== "admin" && currentUser?.rw && targetKk[0].rw !== currentUser.rw) {
            throw { statusCode: 403, message: `Akses ditolak. Kartu Keluarga tujuan berada di luar wilayah RW ${currentUser.rw}.` };
          }

          noKk = targetKk[0].noKk;
        }

        const safeNoKk = noKk || "-";
        const noKkHash = hashKependudukan(safeNoKk);

        const newPendudukData = {
          ...body,
          noKk: safeNoKk,
          kartuKeluargaId,
          nikHash: hashKependudukan(body.nik),
          noKkHash: noKkHash,
        };

        const newData = await tx.insert(pendudukTable).values(newPendudukData).returning();
        const createdRecord = newData[0];
        if (!createdRecord) {
          throw { statusCode: 500, message: "Gagal menyimpan data." };
        }

        if (kartuKeluargaId && body.shdk && body.shdk.toUpperCase() === "KEPALA KELUARGA") {
          await tx
            .update(pendudukTable)
            .set({ shdk: "ANGGOTA KELUARGA" })
            .where(
              and(
                eq(pendudukTable.kartuKeluargaId, kartuKeluargaId),
                eq(pendudukTable.shdk, "KEPALA KELUARGA"),
                sql`${pendudukTable.id} != ${createdRecord.id}`
              )
            );

          await tx
            .update(kartuKeluargaTable)
            .set({ kepalaKeluargaId: createdRecord.id })
            .where(eq(kartuKeluargaTable.id, kartuKeluargaId));
        }

        return createdRecord;
      });

      return reply.status(201).send({ 
        success: true, 
        message: "Data penduduk berhasil ditambahkan.",
        data: withFotoUrl(created)
      });
    } catch (error: any) {
      if (error?.statusCode && error?.message) {
        return reply.status(error.statusCode).send({ success: false, message: error.message });
      }

      fastify.log.error(error);
      const isUniqueViolation = 
        error?.code === '23505' || 
        error?.cause?.code === '23505' ||
        error?.message?.includes('duplicate key') ||
        error?.cause?.message?.includes('duplicate key');

      if (isUniqueViolation) {
        const isKkUnique =
          error?.constraint === "kartu_keluarga_no_kk_hash_unique" ||
          error?.cause?.constraint === "kartu_keluarga_no_kk_hash_unique" ||
          error?.detail?.includes("no_kk_hash") ||
          error?.cause?.detail?.includes("no_kk_hash");

        if (isKkUnique) {
          return reply.status(400).send({ success: false, message: "Nomor KK sudah terdaftar." });
        }
        return reply.status(400).send({ success: false, message: "NIK sudah terdaftar." });
      }
      return reply.status(500).send({ success: false, message: "Gagal menyimpan data." });
    }
  });

  fastify.put<{ Params: ParamsWithId; Body: Partial<PendudukInsert> }>("/api/penduduk/:id", async (request, reply) => {
    try {
      const { id } = request.params;
      const body = { ...request.body };
      delete (body as any).id;
      delete (body as any).createdAt;
      delete (body as any).updatedAt;

      if (body.nik !== undefined && !/^\d{16}$/.test(body.nik)) {
        return reply.status(400).send({ success: false, message: "NIK harus 16 digit angka." });
      }

      if (body.noKk !== undefined && body.noKk !== "-" && !/^\d{16}$/.test(body.noKk)) {
        return reply.status(400).send({ success: false, message: "Nomor KK harus 16 digit angka atau '-'." });
      }

      if (body.nik) body.nikHash = hashKependudukan(body.nik);

      const updated = await db.transaction(async (tx) => {
        const existingList = await tx
          .select()
          .from(pendudukTable)
          .where(eq(pendudukTable.id, id));

        const currentRecord = existingList[0];
        if (!currentRecord) {
          throw { statusCode: 404, message: "Data penduduk tidak ditemukan." };
        }

        const currentUser = (request as any).user;
        if (currentUser?.role !== "admin" && currentUser?.rt && currentRecord.rt !== currentUser.rt) {
          throw { statusCode: 403, message: "Akses ditolak. Anda tidak memiliki izin untuk mengubah data di luar RT Anda." };
        }
        if (currentUser?.role !== "admin" && currentUser?.rw && currentRecord.rw !== currentUser.rw) {
          throw { statusCode: 403, message: "Akses ditolak. Anda tidak memiliki izin untuk mengubah data di luar RW Anda." };
        }
        if (currentUser?.role !== "admin" && currentUser?.rt && body.rt && body.rt !== currentUser.rt) {
          throw { statusCode: 403, message: `Akses ditolak. Anda hanya berwenang untuk wilayah RT ${currentUser.rt}.` };
        }
        if (currentUser?.role !== "admin" && currentUser?.rw && body.rw && body.rw !== currentUser.rw) {
          throw { statusCode: 403, message: `Akses ditolak. Anda hanya berwenang untuk wilayah RW ${currentUser.rw}.` };
        }

        if (body.noKk !== undefined) {
          if (body.noKk === "-") {
            body.noKkHash = hashKependudukan("-");
            body.kartuKeluargaId = null;

            if (currentRecord.kartuKeluargaId) {
              await tx
                .update(kartuKeluargaTable)
                .set({ kepalaKeluargaId: null })
                .where(
                  and(
                    eq(kartuKeluargaTable.id, currentRecord.kartuKeluargaId),
                    eq(kartuKeluargaTable.kepalaKeluargaId, id)
                  )
                );
            }
          } else {
            const newNoKkHash = hashKependudukan(body.noKk);
            body.noKkHash = newNoKkHash;

            const existingKk = await tx
              .select()
              .from(kartuKeluargaTable)
              .where(eq(kartuKeluargaTable.noKkHash, newNoKkHash));

            if (existingKk[0]) {
              if (currentUser?.role !== "admin" && currentUser?.rt && existingKk[0].rt !== currentUser.rt) {
                throw { statusCode: 403, message: `Akses ditolak. Kartu Keluarga dengan No. KK tersebut berada di luar wilayah RT ${currentUser.rt}.` };
              }
              if (currentUser?.role !== "admin" && currentUser?.rw && existingKk[0].rw !== currentUser.rw) {
                throw { statusCode: 403, message: `Akses ditolak. Kartu Keluarga dengan No. KK tersebut berada di luar wilayah RW ${currentUser.rw}.` };
              }
              body.kartuKeluargaId = existingKk[0].id;
            } else {
              const [newKk] = await tx
                .insert(kartuKeluargaTable)
                .values({
                  noKk: body.noKk,
                  noKkHash: newNoKkHash,
                  alamat: body.alamat || currentRecord.alamat,
                  rt: body.rt || currentRecord.rt,
                  rw: body.rw || currentRecord.rw,
                  dusun: "Dusun Krajan",
                  kodePos: "65171",
                })
                .returning();

              if (newKk) {
                body.kartuKeluargaId = newKk.id;
              }
            }

            if (
              currentRecord.kartuKeluargaId &&
              body.kartuKeluargaId &&
              currentRecord.kartuKeluargaId !== body.kartuKeluargaId
            ) {
              await tx
                .update(kartuKeluargaTable)
                .set({ kepalaKeluargaId: null })
                .where(
                  and(
                    eq(kartuKeluargaTable.id, currentRecord.kartuKeluargaId),
                    eq(kartuKeluargaTable.kepalaKeluargaId, id)
                  )
                );
            }
          }
        } else if (body.kartuKeluargaId !== undefined) {
          if (body.kartuKeluargaId === null) {
            body.noKk = "-";
            body.noKkHash = hashKependudukan("-");

            if (currentRecord.kartuKeluargaId) {
              await tx
                .update(kartuKeluargaTable)
                .set({ kepalaKeluargaId: null })
                .where(
                  and(
                    eq(kartuKeluargaTable.id, currentRecord.kartuKeluargaId),
                    eq(kartuKeluargaTable.kepalaKeluargaId, id)
                  )
                );
            }
          } else {
            const targetKk = await tx
              .select()
              .from(kartuKeluargaTable)
              .where(eq(kartuKeluargaTable.id, body.kartuKeluargaId));

            if (!targetKk[0]) {
              throw { statusCode: 404, message: "Data Kartu Keluarga tidak ditemukan." };
            }

            if (currentUser?.role !== "admin" && currentUser?.rt && targetKk[0].rt !== currentUser.rt) {
              throw { statusCode: 403, message: `Akses ditolak. Kartu Keluarga tujuan berada di luar wilayah RT ${currentUser.rt}.` };
            }
            if (currentUser?.role !== "admin" && currentUser?.rw && targetKk[0].rw !== currentUser.rw) {
              throw { statusCode: 403, message: `Akses ditolak. Kartu Keluarga tujuan berada di luar wilayah RW ${currentUser.rw}.` };
            }

            body.noKk = targetKk[0].noKk;
            body.noKkHash = targetKk[0].noKkHash;

            if (
              currentRecord.kartuKeluargaId &&
              currentRecord.kartuKeluargaId !== body.kartuKeluargaId
            ) {
              await tx
                .update(kartuKeluargaTable)
                .set({ kepalaKeluargaId: null })
                .where(
                  and(
                    eq(kartuKeluargaTable.id, currentRecord.kartuKeluargaId),
                    eq(kartuKeluargaTable.kepalaKeluargaId, id)
                  )
                );
            }
          }
        }

        const updatedData = await tx
          .update(pendudukTable)
          .set(body)
          .where(eq(pendudukTable.id, id))
          .returning();

        const updatedRecord = updatedData[0];
        if (!updatedRecord) {
          throw { statusCode: 500, message: "Gagal memperbarui data penduduk." };
        }

        if (updatedRecord.kartuKeluargaId) {
          const isKepala = (body.shdk ? body.shdk : updatedRecord.shdk)?.toUpperCase() === "KEPALA KELUARGA";
          if (isKepala) {
            await tx
              .update(pendudukTable)
              .set({ shdk: "ANGGOTA KELUARGA" })
              .where(
                and(
                  eq(pendudukTable.kartuKeluargaId, updatedRecord.kartuKeluargaId),
                  eq(pendudukTable.shdk, "KEPALA KELUARGA"),
                  sql`${pendudukTable.id} != ${updatedRecord.id}`
                )
              );

            await tx
              .update(kartuKeluargaTable)
              .set({ kepalaKeluargaId: updatedRecord.id })
              .where(eq(kartuKeluargaTable.id, updatedRecord.kartuKeluargaId));

            if (body.alamat || body.rt || body.rw) {
              const kkSyncPayload: any = {};
              if (body.alamat) kkSyncPayload.alamat = body.alamat;
              if (body.rt) kkSyncPayload.rt = body.rt;
              if (body.rw) kkSyncPayload.rw = body.rw;
              await tx
                .update(kartuKeluargaTable)
                .set(kkSyncPayload)
                .where(eq(kartuKeluargaTable.id, updatedRecord.kartuKeluargaId));

              await tx
                .update(pendudukTable)
                .set(kkSyncPayload)
                .where(
                  and(
                    eq(pendudukTable.kartuKeluargaId, updatedRecord.kartuKeluargaId),
                    sql`${pendudukTable.id} != ${updatedRecord.id}`
                  )
                );
            }
          } else if (
            currentRecord.kartuKeluargaId === updatedRecord.kartuKeluargaId &&
            currentRecord.shdk.toUpperCase() === "KEPALA KELUARGA" &&
            body.shdk && body.shdk.toUpperCase() !== "KEPALA KELUARGA"
          ) {
            await tx
              .update(kartuKeluargaTable)
              .set({ kepalaKeluargaId: null })
              .where(
                and(
                  eq(kartuKeluargaTable.id, updatedRecord.kartuKeluargaId),
                  eq(kartuKeluargaTable.kepalaKeluargaId, id)
                )
              );
          }
        }

        return updatedRecord;
      });

      return reply.send({ 
        success: true, 
        message: "Data penduduk berhasil diperbarui.",
        data: withFotoUrl(updated) 
      });
    } catch (error: any) {
      if (error?.statusCode && error?.message) {
        return reply.status(error.statusCode).send({ success: false, message: error.message });
      }

      fastify.log.error(error);
      const isUniqueViolation = 
        error?.code === '23505' || 
        error?.cause?.code === '23505' ||
        error?.message?.includes('duplicate key') ||
        error?.cause?.message?.includes('duplicate key');

      if (isUniqueViolation) {
        return reply.status(400).send({ success: false, message: "NIK sudah terdaftar." });
      }
      return reply.status(500).send({ success: false, message: "Gagal memperbarui data." });
    }
  });

  fastify.get<{ Params: ParamsWithId }>("/api/penduduk/:id/foto", async (request, reply) => {
    try {
      const { id } = request.params;

      const existing = await db.select().from(pendudukTable).where(eq(pendudukTable.id, id));
      const current = existing[0];
      if (!current || !current.foto) {
        return reply.status(404).send({ success: false, message: "Foto penduduk tidak ditemukan." });
      }

      const currentUser = (request as any).user;
      if (currentUser?.role !== "admin" && currentUser?.rt && current.rt !== currentUser.rt) {
        return reply.status(403).send({ success: false, message: `Akses ditolak. Anda hanya berwenang untuk wilayah RT ${currentUser.rt}.` });
      }
      if (currentUser?.role !== "admin" && currentUser?.rw && current.rw !== currentUser.rw) {
        return reply.status(403).send({ success: false, message: `Akses ditolak. Anda hanya berwenang untuk wilayah RW ${currentUser.rw}.` });
      }

      const stream = await getFotoStream(current.foto);
      const ext = path.extname(current.foto).toLowerCase();
      const mimeTypes: Record<string, string> = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
      };
      reply.header("Content-Type", mimeTypes[ext] || "application/octet-stream");
      reply.header("Cache-Control", "private, max-age=3600");
      return reply.send(stream);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ success: false, message: "Gagal mengambil foto penduduk." });
    }
  });

  fastify.post<{ Params: ParamsWithId }>("/api/penduduk/:id/foto", async (request, reply) => {
    try {
      const { id } = request.params;

      const existing = await db.select().from(pendudukTable).where(eq(pendudukTable.id, id));
      const current = existing[0];
      if (!current) {
        return reply.status(404).send({ success: false, message: "Data penduduk tidak ditemukan." });
      }

      const currentUser = (request as any).user;
      if (currentUser?.role !== "admin" && currentUser?.rt && current.rt !== currentUser.rt) {
        return reply.status(403).send({ success: false, message: `Akses ditolak. Anda hanya berwenang untuk wilayah RT ${currentUser.rt}.` });
      }
      if (currentUser?.role !== "admin" && currentUser?.rw && current.rw !== currentUser.rw) {
        return reply.status(403).send({ success: false, message: `Akses ditolak. Anda hanya berwenang untuk wilayah RW ${currentUser.rw}.` });
      }

      const file = await request.file();
      if (!file) {
        return reply.status(400).send({ success: false, message: "File foto wajib diunggah." });
      }

      const allowedMimeExtMap: Record<string, string> = {
        "image/jpeg": ".jpg",
        "image/jpg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
      };

      const normalizedMime = (file.mimetype || "").toLowerCase();
      const ext = allowedMimeExtMap[normalizedMime];

      if (!ext) {
        return reply.status(400).send({
          success: false,
          message: "Format file tidak didukung. Harap unggah gambar JPG, PNG, atau WebP.",
        });
      }

      const buffer = await file.toBuffer();

      if (buffer.length < 8) {
        return reply.status(400).send({
          success: false,
          message: "Ukuran file terlalu kecil atau file gambar rusak.",
        });
      }

      const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
      const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
      const isWebp =
        buffer.subarray(0, 4).toString("latin1") === "RIFF" &&
        buffer.subarray(8, 12).toString("latin1") === "WEBP";

      if (!isJpeg && !isPng && !isWebp) {
        return reply.status(400).send({
          success: false,
          message: "Konten file tidak sesuai dengan format gambar JPG, PNG, atau WebP yang valid.",
        });
      }

      if (current.foto) {
        await deleteFotoPenduduk(current.foto);
      }

      const objectKey = await uploadFotoPenduduk(id, buffer, file.mimetype, ext);

      const updated = await db
        .update(pendudukTable)
        .set({ foto: objectKey })
        .where(eq(pendudukTable.id, id))
        .returning();

      return reply.send({
        success: true,
        message: "Foto penduduk berhasil diunggah.",
        data: withFotoUrl(updated[0]),
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ success: false, message: "Gagal mengunggah foto penduduk." });
    }
  });

  fastify.delete<{ Params: ParamsWithId }>("/api/penduduk/:id/foto", async (request, reply) => {
    try {
      const { id } = request.params;

      const existing = await db.select().from(pendudukTable).where(eq(pendudukTable.id, id));
      const current = existing[0];
      if (!current) {
        return reply.status(404).send({ success: false, message: "Data penduduk tidak ditemukan." });
      }

      const currentUser = (request as any).user;
      if (currentUser?.role !== "admin" && currentUser?.rt && current.rt !== currentUser.rt) {
        return reply.status(403).send({ success: false, message: `Akses ditolak. Anda hanya berwenang untuk wilayah RT ${currentUser.rt}.` });
      }
      if (currentUser?.role !== "admin" && currentUser?.rw && current.rw !== currentUser.rw) {
        return reply.status(403).send({ success: false, message: `Akses ditolak. Anda hanya berwenang untuk wilayah RW ${currentUser.rw}.` });
      }

      if (current.foto) {
        await deleteFotoPenduduk(current.foto);
      }

      const updated = await db
        .update(pendudukTable)
        .set({ foto: null })
        .where(eq(pendudukTable.id, id))
        .returning();

      return reply.send({
        success: true,
        message: "Foto penduduk berhasil dihapus.",
        data: withFotoUrl(updated[0]),
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ success: false, message: "Gagal menghapus foto penduduk." });
    }
  });

  fastify.delete<{ Params: ParamsWithId }>("/api/penduduk/:id", { preHandler: requireAdmin }, async (request, reply) => {
    try {
      const { id } = request.params;

      const deleted = await db.transaction(async (tx) => {
        await tx
          .update(kartuKeluargaTable)
          .set({ kepalaKeluargaId: null })
          .where(eq(kartuKeluargaTable.kepalaKeluargaId, id));

        const deletedData = await tx
          .delete(pendudukTable)
          .where(eq(pendudukTable.id, id))
          .returning();

        return deletedData[0];
      });

      if (!deleted) {
        return reply.status(404).send({ success: false, message: "Data penduduk tidak ditemukan." });
      }

      if (deleted.foto) {
        await deleteFotoPenduduk(deleted.foto);
      }

      return reply.send({ success: true, message: "Data penduduk berhasil dihapus." });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ success: false, message: "Gagal menghapus data." });
    }
  });
}