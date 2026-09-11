import type { FastifyInstance } from "fastify";
import { auth } from "../lib/auth.js";
import { fromNodeHeaders } from "better-auth/node";
import { requireAuth } from "../middlewares/auth.middleware.js";

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.route({
    method: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    url: "/api/auth/*",
    async handler(request, reply) {
      try {
        const protocol = request.protocol || (request.headers["x-forwarded-proto"] as string) || "http";
        const host = (request.headers["x-forwarded-host"] as string) || request.headers.host || "localhost";
        const url = new URL(request.url, `${protocol}://${host}`);
        const headers = fromNodeHeaders(request.headers);
        const hasBody = request.body && request.method !== "GET" && request.method !== "HEAD";

        const req = new Request(url.toString(), {
          method: request.method,
          headers,
          ...(hasBody ? { body: JSON.stringify(request.body) } : {}),
        });

        const response = await auth.handler(req);

        reply.status(response.status);

        if (typeof (response.headers as any).getSetCookie === "function") {
          const cookies: string[] = (response.headers as any).getSetCookie();
          cookies.forEach((cookieStr) => {
            reply.header("set-cookie", cookieStr);
          });
        }

        response.headers.forEach((value, key) => {
          if (key.toLowerCase() !== "set-cookie") {
            reply.header(key, value);
          }
        });
        
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

  fastify.get("/api/me", { preHandler: requireAuth }, async (request, reply) => {
    const user = (request as any).user;
    
    return reply.send({
      message: "Anda berhasil mengakses rute terproteksi!",
      user: user,
    });
  });
}