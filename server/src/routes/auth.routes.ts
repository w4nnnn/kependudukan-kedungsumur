import type { FastifyInstance } from "fastify";
import { auth } from "../lib/auth.js";
import { fromNodeHeaders } from "better-auth/node";

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.route({
    method: ["GET", "POST"],
    url: "/api/auth/*",
    async handler(request, reply) {
      try {
        const url = new URL(request.url, `http://${request.headers.host}`);
        const headers = fromNodeHeaders(request.headers);

        const req = new Request(url.toString(), {
          method: request.method,
          headers,
          ...(request.body ? { body: JSON.stringify(request.body) } : {}),
        });

        const response = await auth.handler(req);

        reply.status(response.status);
        response.headers.forEach((value, key) => reply.header(key, value));
        
        if (response.body) {
          return reply.send(await response.text());
        }
        return reply.send();
      } catch (error: any) {
        fastify.log.error("Authentication Error:", error);
        return reply.status(500).send({ 
          error: "Internal authentication error",
          code: "AUTH_FAILURE"
        });
      }
    }
  });

  fastify.get("/api/me", async (request, reply) => {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });

    if (!session) {
      return reply.status(401).send({ error: "Unauthorized. Anda belum login." });
    }

    return reply.send({
      message: "Anda berhasil mengakses rute terproteksi!",
      user: session.user,
    });
  });
}