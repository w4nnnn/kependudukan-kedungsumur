import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { db } from "../db/index.js";
import { pendudukTable, hashKependudukan } from "../db/schema/schema.js";
import { eq, ilike, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.middleware.js";

type PendudukInsert = typeof pendudukTable.$inferInsert;
type ParamsWithId = { id: string };

export default async function pendudukRoutes(fastify: FastifyInstance) {
  
  fastify.addHook("preHandler", requireAuth);

  fastify.get("/api/penduduk", async (request, reply) => {
    try {
      const { search, nik, nokk, limit = 100, page = 1 } = request.query as any;
      const offset = (Number(page) - 1) * Number(limit);

      let query = db.select().from(pendudukTable).$dynamic();

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

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const data = await query.limit(Number(limit)).offset(offset);
      return reply.send({ success: true, data });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ success: false, message: "Gagal mengambil data." });
    }
  });

  fastify.get<{ Params: ParamsWithId }>("/api/penduduk/:id", async (request, reply) => {
    try {
      const { id } = request.params;
      const data = await db.select().from(pendudukTable).where(eq(pendudukTable.id, id));
      
      if (data.length === 0) {
        return reply.status(404).send({ success: false, message: "Data penduduk tidak ditemukan." });
      }

      return reply.send({ success: true, data: data[0] });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ success: false, message: "Gagal mengambil data." });
    }
  });

  fastify.post<{ Body: PendudukInsert }>("/api/penduduk", async (request, reply) => {
    try {
      const body = request.body;
      
      const newPendudukData = {
        ...body,
        nikHash: hashKependudukan(body.nik),
        noKkHash: hashKependudukan(body.noKk)
      };
      
      const newData = await db.insert(pendudukTable).values(newPendudukData).returning();
      
      return reply.status(201).send({ 
        success: true, 
        message: "Data penduduk berhasil ditambahkan.",
        data: newData[0]
      });
    } catch (error: any) {
      fastify.log.error(error);
      if (error.code === '23505') {
        return reply.status(400).send({ success: false, message: "NIK sudah terdaftar." });
      }
      return reply.status(500).send({ success: false, message: "Gagal menyimpan data." });
    }
  });

  fastify.put<{ Params: ParamsWithId; Body: Partial<PendudukInsert> }>("/api/penduduk/:id", async (request, reply) => {
    try {
      const { id } = request.params;
      const body = request.body;

      if (body.nik) body.nikHash = hashKependudukan(body.nik);
      if (body.noKk) body.noKkHash = hashKependudukan(body.noKk);

      const updatedData = await db
        .update(pendudukTable)
        .set(body)
        .where(eq(pendudukTable.id, id))
        .returning();

      if (updatedData.length === 0) {
        return reply.status(404).send({ success: false, message: "Data penduduk tidak ditemukan." });
      }

      return reply.send({ 
        success: true, 
        message: "Data penduduk berhasil diperbarui.",
        data: updatedData[0] 
      });
    } catch (error: any) {
      fastify.log.error(error);
      if (error.code === '23505') {
        return reply.status(400).send({ success: false, message: "NIK sudah terdaftar." });
      }
      return reply.status(500).send({ success: false, message: "Gagal memperbarui data." });
    }
  });

  fastify.delete<{ Params: ParamsWithId }>("/api/penduduk/:id", async (request, reply) => {
    try {
      const { id } = request.params;
      const deletedData = await db.delete(pendudukTable).where(eq(pendudukTable.id, id)).returning();

      if (deletedData.length === 0) {
        return reply.status(404).send({ success: false, message: "Data penduduk tidak ditemukan." });
      }

      return reply.send({ success: true, message: "Data penduduk berhasil dihapus." });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ success: false, message: "Gagal menghapus data." });
    }
  });
}