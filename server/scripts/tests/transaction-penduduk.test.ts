import "dotenv/config";
import fastify from "fastify";
import { db } from "../../src/db/index.js";
import { kartuKeluargaTable, pendudukTable, hashKependudukan } from "../../src/db/schema/schema.js";
import { eq } from "drizzle-orm";
import pendudukRoutes from "../../src/routes/penduduk.routes.js";
import authRoutes from "../../src/routes/auth.routes.js";
import { auth } from "../../src/lib/auth.js";
import { config, generate16Digits } from "./config.js";

async function run() {
  console.log("Menjalankan test transaksi POST /api/penduduk...");

  const loginRes = await auth.api.signInUsername({
    body: {
      username: config.adminUsername,
      password: config.adminPassword,
    },
    asResponse: true,
  });

  const cookieHeader = loginRes.headers.get("set-cookie") || "";
  const authHeaders: Record<string, string> = {
    "Origin": config.baseUrl,
    "Cookie": cookieHeader.split(";")[0] || "",
  };

  const app = fastify();
  await app.register(authRoutes);
  await app.register(pendudukRoutes);

  const existingNik = generate16Digits("3573");
  const existingKkNo = generate16Digits("3573");
  const orphanKkNo = generate16Digits("3573");

  const [initialPenduduk] = await db
    .insert(pendudukTable)
    .values({
      nik: existingNik,
      nikHash: hashKependudukan(existingNik),
      noKk: existingKkNo,
      noKkHash: hashKependudukan(existingKkNo),
      namaLengkap: "Penduduk Awal Transaksi",
      tempatLahir: "Kedungsumur",
      tanggalLahir: "1990-01-01",
      jenisKelamin: "Laki-laki",
      alamat: "Jl. Pengujian Transaksi",
      rt: "001",
      rw: "001",
      agama: "Islam",
      statusPerkawinan: "Belum Kawin",
    })
    .returning();

  console.log(`Penduduk awal dibuat dengan NIK: ${existingNik}`);

  try {
    const response = await app.inject({
      method: "POST",
      url: "/api/penduduk",
      headers: authHeaders,
      payload: {
        nik: existingNik,
        namaLengkap: "Penduduk Gagal",
        tempatLahir: "Kedungsumur",
        tanggalLahir: "1992-02-02",
        jenisKelamin: "Perempuan",
        alamat: "Jl. Pengujian Transaksi",
        rt: "001",
        rw: "001",
        agama: "Islam",
        statusPerkawinan: "Belum Kawin",
        createKk: {
          noKk: orphanKkNo,
          alamat: "Jl. Pengujian Transaksi Baru",
          rt: "001",
          rw: "001",
        },
      },
    });

    console.log(`Response status: ${response.statusCode}, body:`, response.body);

    if (response.statusCode !== 400) {
      throw new Error(`Expected status 400 for duplicate NIK, got ${response.statusCode}`);
    }

    const orphanKk = await db
      .select()
      .from(kartuKeluargaTable)
      .where(eq(kartuKeluargaTable.noKkHash, hashKependudukan(orphanKkNo)));

    console.log(`Hasil query kartu_keluarga untuk noKk ${orphanKkNo}: ${orphanKk.length} record`);

    if (orphanKk.length > 0) {
      await db.delete(kartuKeluargaTable).where(eq(kartuKeluargaTable.id, orphanKk[0]!.id));
      throw new Error(
        `BUG TERDETEKSI: KK dengan No ${orphanKkNo} tertinggal di database (tidak di-rollback saat insert penduduk gagal)!`
      );
    }

    console.log("✅ BERHASIL: Kartu keluarga berhasil di-rollback saat insert penduduk gagal.");

    const successNik = generate16Digits("3573");
    const successKkNo = generate16Digits("3573");

    const successResponse = await app.inject({
      method: "POST",
      url: "/api/penduduk",
      headers: authHeaders,
      payload: {
        nik: successNik,
        namaLengkap: "Bapak Sukses Transaksi",
        tempatLahir: "Kedungsumur",
        tanggalLahir: "1985-05-05",
        jenisKelamin: "Laki-laki",
        alamat: "Jl. Sukses Transaksi",
        rt: "002",
        rw: "002",
        agama: "Islam",
        statusPerkawinan: "Kawin",
        shdk: "KEPALA KELUARGA",
        createKk: {
          noKk: successKkNo,
          alamat: "Jl. Sukses Transaksi",
          rt: "002",
          rw: "002",
        },
      },
    });

    if (successResponse.statusCode !== 201) {
      throw new Error(`Expected status 201, got ${successResponse.statusCode}: ${successResponse.body}`);
    }

    const successJson = JSON.parse(successResponse.body);
    const createdPendudukId = successJson.data.id;
    const createdKkId = successJson.data.kartuKeluargaId;

    if (!createdKkId) {
      throw new Error("kartuKeluargaId tidak terhubung pada data penduduk yang dibuat!");
    }

    const createdKk = await db
      .select()
      .from(kartuKeluargaTable)
      .where(eq(kartuKeluargaTable.id, createdKkId));

    if (createdKk.length === 0) {
      throw new Error("Record KK tidak ditemukan!");
    }

    if (createdKk[0]!.kepalaKeluargaId !== createdPendudukId) {
      throw new Error(
        `kepalaKeluargaId pada KK (${createdKk[0]!.kepalaKeluargaId}) tidak sesuai dengan ID penduduk (${createdPendudukId})!`
      );
    }

    console.log("✅ BERHASIL: Kasus sukses membuat KK dan mengaitkan kepalaKeluargaId dengan benar.");

    await db.delete(pendudukTable).where(eq(pendudukTable.id, createdPendudukId));
    await db.delete(kartuKeluargaTable).where(eq(kartuKeluargaTable.id, createdKkId));
  } finally {
    if (initialPenduduk) {
      await db.delete(pendudukTable).where(eq(pendudukTable.id, initialPenduduk.id));
    }
  }
}

run().catch((err) => {
  console.error("❌ Test GAGAL:", err.message);
  process.exit(1);
});
