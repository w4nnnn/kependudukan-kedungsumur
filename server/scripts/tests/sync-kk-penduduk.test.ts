import "dotenv/config";
import fastify from "fastify";
import { db } from "../../src/db/index.js";
import { kartuKeluargaTable, pendudukTable, hashKependudukan } from "../../src/db/schema/schema.js";
import { eq } from "drizzle-orm";
import pendudukRoutes from "../../src/routes/penduduk.routes.js";
import authRoutes from "../../src/routes/auth.routes.js";
import { auth } from "../../src/lib/auth.js";
import { config, generate16Digits } from "./config.js";
import { assertEqual, assert } from "./assertions.js";

async function run() {
  console.log("Menjalankan test sinkronisasi kartuKeluargaId saat noKk diupdate...");

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
    "Content-Type": "application/json",
  };

  const app = fastify();
  await app.register(authRoutes);
  await app.register(pendudukRoutes);

  const noKkA = generate16Digits("3573");
  const noKkB = generate16Digits("3573");
  const nikTest = generate16Digits("3573");

  const [kkA] = await db
    .insert(kartuKeluargaTable)
    .values({
      noKk: noKkA,
      noKkHash: hashKependudukan(noKkA),
      alamat: "Jl. Dusun A",
      rt: "001",
      rw: "001",
    })
    .returning();

  const [kkB] = await db
    .insert(kartuKeluargaTable)
    .values({
      noKk: noKkB,
      noKkHash: hashKependudukan(noKkB),
      alamat: "Jl. Dusun B",
      rt: "002",
      rw: "002",
    })
    .returning();

  const [penduduk] = await db
    .insert(pendudukTable)
    .values({
      nik: nikTest,
      nikHash: hashKependudukan(nikTest),
      noKk: noKkA,
      noKkHash: hashKependudukan(noKkA),
      kartuKeluargaId: kkA!.id,
      namaLengkap: "Penduduk Uji Sinkron",
      tempatLahir: "Kedungsumur",
      tanggalLahir: "1994-04-04",
      jenisKelamin: "Laki-laki",
      alamat: "Jl. Dusun A",
      rt: "001",
      rw: "001",
      agama: "Islam",
      statusPerkawinan: "Belum Kawin",
    })
    .returning();

  try {
    const updateRes = await app.inject({
      method: "PUT",
      url: `/api/penduduk/${penduduk!.id}`,
      headers: authHeaders,
      payload: {
        noKk: noKkB,
      },
    });

    assertEqual(updateRes.statusCode, 200, "Update penduduk response status");

    const [updatedPenduduk] = await db
      .select()
      .from(pendudukTable)
      .where(eq(pendudukTable.id, penduduk!.id));

    assert(Boolean(updatedPenduduk), "Data penduduk terupdate harus ditemukan");
    assertEqual(
      updatedPenduduk!.kartuKeluargaId,
      kkB!.id,
      `kartuKeluargaId harus sinkron ke KK B (${kkB!.id}), bukan tertinggal di KK A (${kkA!.id})`
    );

    const detachRes = await app.inject({
      method: "PUT",
      url: `/api/penduduk/${penduduk!.id}`,
      headers: authHeaders,
      payload: {
        noKk: "-",
      },
    });

    assertEqual(detachRes.statusCode, 200, "Detach noKk response status");

    const [detachedPenduduk] = await db
      .select()
      .from(pendudukTable)
      .where(eq(pendudukTable.id, penduduk!.id));

    assertEqual(
      detachedPenduduk!.kartuKeluargaId,
      null,
      "kartuKeluargaId harus menjadi null saat noKk diubah menjadi '-'"
    );

    const promoteRes = await app.inject({
      method: "PUT",
      url: `/api/penduduk/${penduduk!.id}`,
      headers: authHeaders,
      payload: {
        noKk: noKkA,
        shdk: "KEPALA KELUARGA",
      },
    });
    assertEqual(promoteRes.statusCode, 200, "Promote to kepala keluarga response status");

    const [kkAfterPromote] = await db
      .select()
      .from(kartuKeluargaTable)
      .where(eq(kartuKeluargaTable.id, kkA!.id));
    assertEqual(
      kkAfterPromote!.kepalaKeluargaId,
      penduduk!.id,
      "kepalaKeluargaId pada KK harus diset ke penduduk yang dipromosikan"
    );

    const demoteRes = await app.inject({
      method: "PUT",
      url: `/api/penduduk/${penduduk!.id}`,
      headers: authHeaders,
      payload: {
        shdk: "ANAK",
      },
    });
    assertEqual(demoteRes.statusCode, 200, "Demote to anak response status");

    const [kkAfterDemote] = await db
      .select()
      .from(kartuKeluargaTable)
      .where(eq(kartuKeluargaTable.id, kkA!.id));
    assertEqual(
      kkAfterDemote!.kepalaKeluargaId,
      null,
      "kepalaKeluargaId pada KK harus dibersihkan saat SHDK diturunkan dari KEPALA KELUARGA"
    );

    console.log("✅ All sync tests passed!");
  } finally {
    if (penduduk) {
      await db.delete(pendudukTable).where(eq(pendudukTable.id, penduduk.id));
    }
    if (kkA) {
      await db.delete(kartuKeluargaTable).where(eq(kartuKeluargaTable.id, kkA.id));
    }
    if (kkB) {
      await db.delete(kartuKeluargaTable).where(eq(kartuKeluargaTable.id, kkB.id));
    }
  }
}

run().catch((err) => {
  console.error("❌ Test failed:", err.message);
  process.exit(1);
});
