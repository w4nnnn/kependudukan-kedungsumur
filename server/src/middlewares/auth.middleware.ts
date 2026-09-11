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

  if ((session.user as any).banned) {
    const reason = (session.user as any).banReason || "Akun Anda telah dinonaktifkan oleh administrator.";
    return reply.status(403).send({ 
      error: "Forbidden. Akun Anda telah diblokir.",
      message: reason 
    });
  }

  // Menyimpan data user ke objek request agar bisa diakses oleh route
  (request as any).user = session.user;
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  if (!(request as any).user) {
    await requireAuth(request, reply);
    if (reply.sent) return;
  }

  const user = (request as any).user;
  if (!user || user.role !== "admin") {
    return reply.status(403).send({ 
      error: "Forbidden. Operasi ini membutuhkan hak akses Administrator.",
      message: "Akses ditolak. Anda tidak memiliki izin untuk melakukan tindakan ini." 
    });
  }
}