import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { db } from "../db/index.js";
import { pendudukTable } from "../db/schema/schema.js";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.middleware.js";

// Definisi tipe data agar TypeScript di Fastify tidak protes
type PendudukInsert = typeof pendudukTable.$inferInsert;
type ParamsWithId = { id: string };

export default async function pendudukRoutes(fastify: FastifyInstance) {
  
  // Semua route di dalam blok ini akan otomatis diproteksi oleh requireAuth
  // Jadi hanya Admin yang bisa mengaksesnya
  fastify.addHook("preHandler", requireAuth);

  // 1. GET ALL (Melihat semua data penduduk)
  fastify.get("/api/penduduk", async (request, reply) => {
    try {
      const data = await db.select().from(pendudukTable);
      return reply.send({ success: true, data });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ success: false, message: "Gagal mengambil data." });
    }
  });

  // 2. GET ONE (Melihat data penduduk berdasarkan ID)
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

  // 3. POST (Menambah data penduduk baru)
  fastify.post<{ Body: PendudukInsert }>("/api/penduduk", async (request, reply) => {
    try {
      const body = request.body;
      
      // Catatan: NIK dan KK otomatis dienkripsi oleh Drizzle berkat Custom Type kita
      const newData = await db.insert(pendudukTable).values(body).returning();
      
      return reply.status(201).send({ 
        success: true, 
        message: "Data penduduk berhasil ditambahkan.",
        data: newData[0]
      });
    } catch (error: any) {
      fastify.log.error(error);
      // Menangani pesan error jika NIK duplikat
      if (error.code === '23505') {
        return reply.status(400).send({ success: false, message: "NIK sudah terdaftar." });
      }
      return reply.status(500).send({ success: false, message: "Gagal menyimpan data." });
    }
  });

  // 4. PUT (Mengubah data penduduk)
  fastify.put<{ Params: ParamsWithId; Body: Partial<PendudukInsert> }>("/api/penduduk/:id", async (request, reply) => {
    try {
      const { id } = request.params;
      const body = request.body;

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

  // 5. DELETE (Menghapus data penduduk)
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