import fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import "dotenv/config";
import authRoutes from "./routes/auth.routes.js";
import pendudukRoutes from "./routes/penduduk.routes.js";
import kkRoutes from "./routes/kk.routes.js";
import statsRoutes from "./routes/stats.routes.js";
import exportImportRoutes from "./routes/export-import.routes.js";
import { initMinioBucket } from "./lib/minio.js";

const app = fastify({
  trustProxy: true,
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'SYS:HH:MM:ss',
        ignore: 'pid,hostname',
      },
    },
  },
});

app.setErrorHandler((error: any, request, reply) => {
  request.log.error(error);
  if (error.statusCode === 429) {
    return reply.status(429).send({
      statusCode: 429,
      error: "Too Many Requests",
      message: "Terlalu banyak permintaan. Harap tunggu beberapa saat sebelum mencoba lagi.",
    });
  }
  const statusCode = error.statusCode && error.statusCode >= 400 && error.statusCode < 600 ? error.statusCode : 500;
  return reply.status(statusCode).send({
    statusCode,
    error: error.name || "Internal Server Error",
    message: statusCode === 500 ? "Terjadi kesalahan pada server internal." : error.message,
  });
});

app.register(cors, {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  exposedHeaders: ["Content-Disposition"],
});

app.register(rateLimit, {
  max: 300,
  timeWindow: "1 minute",
});

app.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },
});

app.register(authRoutes);
app.register(pendudukRoutes);
app.register(kkRoutes);
app.register(statsRoutes);
app.register(exportImportRoutes);

app.get("/", async (request, reply) => {
  return { message: "Selamat Datang di API Kependudukan Desa Kedungsumur" };
});

const start = async () => {
  try {
    await initMinioBucket();

    const port = parseInt(process.env.PORT || "4000", 10);
    
    await app.listen({ port, host: "0.0.0.0" });
    console.log(`🚀 Server API berjalan di http://localhost:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();