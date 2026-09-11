import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { db } from "../db/index.js";
import { pendudukTable, kartuKeluargaTable, hashKependudukan } from "../db/schema/schema.js";
import { eq, ilike, and, sql, desc } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth.middleware.js";
import { uploadFotoPenduduk, deleteFotoPenduduk, getPublicFotoUrl } from "../lib/minio.js";
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
      const offset = (Number(page) - 1) * Number(limit);

      let query = db.select().from(pendudukTable).$dynamic();
      let countQuery = db.select({ count: sql<number>`cast(count(${pendudukTable.id}) as integer)` }).from(pendudukTable).$dynamic();

      const conditions = [];

      if (search) {
        conditions.push(ilike(pendudukTable.namaLengkap, `%${search}%`));
      }
      
      if (nik) {
        conditions.push(eq(pendudukTable.nikHash, hashKependudukan(nik)));
      }

      if (nokk) {
        conditions.push(eq(pendudukTable.noKkHash, hashKependudukan(nokk)));
      }

      if (kkId) {
        conditions.push(eq(pendudukTable.kartuKeluargaId, kkId));
      }

      if (rt) {
        conditions.push(eq(pendudukTable.rt, rt));
      }

      if (rw) {
        conditions.push(eq(pendudukTable.rw, rw));
      }

      if (conditions.length > 0) {
        const whereCondition = and(...conditions);
        query = query.where(whereCondition);
        countQuery = countQuery.where(whereCondition);
      }

      const [data, totalCount] = await Promise.all([
        query.orderBy(desc(pendudukTable.createdAt)).limit(Number(limit)).offset(offset),
        countQuery
      ]);

      const total = totalCount[0]?.count ?? 0;
      const totalPages = Math.ceil(total / Number(limit));

      return reply.send({ 
        success: true, 
        data: data.map(withFotoUrl),
        meta: {
          total,
          page: Number(page),
          limit: Number(limit),
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
            .orderBy(pendudukTable.urutanKk);

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

      if (createKk && (!createKk.noKk || createKk.noKk.length !== 16)) {
        return reply.status(400).send({ success: false, message: "Nomor KK harus 16 digit." });
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

        const noKkHash = hashKependudukan(noKk);

        if (!kartuKeluargaId) {
          const existingKk = await tx
            .select()
            .from(kartuKeluargaTable)
            .where(eq(kartuKeluargaTable.noKkHash, noKkHash));
          if (existingKk[0]) {
            kartuKeluargaId = existingKk[0].id;
          }
        }

        const newPendudukData = {
          ...body,
          noKk,
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

            if (targetKk[0]) {
              body.noKk = targetKk[0].noKk;
              body.noKkHash = targetKk[0].noKkHash;
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

        if (updatedRecord.kartuKeluargaId && body.shdk) {
          if (body.shdk.toUpperCase() === "KEPALA KELUARGA") {
            await tx
              .update(kartuKeluargaTable)
              .set({ kepalaKeluargaId: updatedRecord.id })
              .where(eq(kartuKeluargaTable.id, updatedRecord.kartuKeluargaId));
          } else if (
            currentRecord.kartuKeluargaId === updatedRecord.kartuKeluargaId &&
            currentRecord.shdk.toUpperCase() === "KEPALA KELUARGA"
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

  fastify.post<{ Params: ParamsWithId }>("/api/penduduk/:id/foto", async (request, reply) => {
    try {
      const { id } = request.params;

      const existing = await db.select().from(pendudukTable).where(eq(pendudukTable.id, id));
      const current = existing[0];
      if (!current) {
        return reply.status(404).send({ success: false, message: "Data penduduk tidak ditemukan." });
      }

      const file = await request.file();
      if (!file) {
        return reply.status(400).send({ success: false, message: "File foto wajib diunggah." });
      }

      const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return reply.status(400).send({
          success: false,
          message: "Format file tidak didukung. Harap unggah gambar JPG, PNG, atau WebP.",
        });
      }

      const buffer = await file.toBuffer();
      const ext = path.extname(file.filename) || (file.mimetype === "image/png" ? ".png" : file.mimetype === "image/webp" ? ".webp" : ".jpg");

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