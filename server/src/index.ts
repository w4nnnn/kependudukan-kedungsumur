import fastify from "fastify";
import "dotenv/config";
import authRoutes from "./routes/auth.routes.js";

const app = fastify({
  logger: true,
});

app.register(authRoutes);

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