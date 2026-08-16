import fastify from "fastify";
import cors from "@fastify/cors";
import "dotenv/config";
import authRoutes from "./routes/auth.routes.js";
import pendudukRoutes from "./routes/penduduk.routes.js";

const app = fastify({
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

app.register(cors, {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
});

app.register(authRoutes);
app.register(pendudukRoutes);

app.get("/", async (request, reply) => {
  return { message: "Selamat Datang di API Kependudukan Desa Kedungsumur" };
});

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || "3000", 10);
    
    await app.listen({ port, host: "0.0.0.0" });
    console.log(`🚀 Server API berjalan di http://localhost:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();