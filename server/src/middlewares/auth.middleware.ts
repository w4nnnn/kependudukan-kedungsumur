import type { FastifyRequest, FastifyReply } from "fastify";
import { auth } from "../lib/auth.js";
import { fromNodeHeaders } from "better-auth/node";

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(request.headers),
  });

  if (!session) {
    return reply.status(401).send({ error: "Unauthorized. Anda belum login." });
  }

  // Menyimpan data user ke objek request agar bisa diakses oleh route
  // (Memerlukan sedikit trik TypeScript untuk FastifyRequest, namun bisa menggunakan any sementara atau custom type declaration)
  (request as any).user = session.user;
}