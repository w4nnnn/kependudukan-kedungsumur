import fastify from "fastify";
import "dotenv/config";
import { auth } from "./lib/auth.js";
import { fromNodeHeaders } from "better-auth/node";

const app = fastify({
  logger: true,
});

app.route({
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
      app.log.error("Authentication Error:", error);
      return reply.status(500).send({ 
        error: "Internal authentication error",
        code: "AUTH_FAILURE"
      });
    }
  }
});

app.get("/api/me", async (request, reply) => {
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

app.get("/", async (request, reply) => {
  return { message: "Selamat Datang di API Kependudukan Desa Kedungsumur" };
});

const start = async () => {
  try {
    await app.listen({ port: 3000, host: "0.0.0.0" });
    console.log("🚀 Server API berjalan di http://localhost:3000");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();