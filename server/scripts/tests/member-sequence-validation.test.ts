import { TestClient, TestRunner } from "./client.js";
import { assert, assertEqual } from "./assertions.js";
import { config, colors, generate16Digits } from "./config.js";

export async function runMemberSequenceTests(providedClient?: TestClient, providedRunner?: TestRunner) {
  const runner = providedRunner || new TestRunner();
  const client = providedClient || new TestClient();

  console.log(`\n${colors.bright}13. Urutan Sekuensial Otomatis Anggota KK (Prioritas 6)${colors.reset}`);

  if (!client.sessionToken) {
    const adminLoginRes = await client.request("/api/auth/sign-in/username", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Origin": config.baseUrl },
      body: JSON.stringify({
        username: config.adminUsername,
        password: config.adminPassword,
      }),
    });
    assertEqual(adminLoginRes.status, 200, "Admin login success");
    client.sessionToken = adminLoginRes.body.token;
  }

  const noKk = generate16Digits("3573");
  const nikKepala = generate16Digits("3573");
  const nikAnggota1 = generate16Digits("3573");
  const nikAnggota2 = generate16Digits("3573");

  let kkId = "";
  let kepalaId = "";
  let m1Id = "";
  let m2Id = "";

  try {
    // 1. Buat KK dengan Kepala Keluarga (urutanKk = "1")
    const createKkRes = await client.request("/api/kk", {
      method: "POST",
      headers: client.getAuthHeaders(),
      body: JSON.stringify({
        noKk,
        alamat: "Jl. Sekuensial No. 1",
        rt: "001",
        rw: "001",
        modeKepala: "create",
        newPenduduk: {
          nik: nikKepala,
          namaLengkap: "Kepala Sekuensial",
          tempatLahir: "Kedungsumur",
          tanggalLahir: "1980-01-01",
          jenisKelamin: "Laki-laki",
          agama: "Islam",
          statusPerkawinan: "Kawin",
        },
      }),
    });
    assertEqual(createKkRes.status, 201, "Setup KK status 201");
    kkId = createKkRes.body?.data?.id;
    kepalaId = createKkRes.body?.data?.kepalaKeluargaId;

    // 2. Tambah Anggota 1 (Istri) TANPA mengirimkan urutanKk
    const addM1Res = await client.request(`/api/kk/${kkId}/anggota`, {
      method: "POST",
      headers: client.getAuthHeaders(),
      body: JSON.stringify({
        mode: "create",
        shdk: "ISTRI",
        penduduk: {
          nik: nikAnggota1,
          namaLengkap: "Istri Sekuensial",
          tempatLahir: "Kedungsumur",
          tanggalLahir: "1983-03-03",
          jenisKelamin: "Perempuan",
          agama: "Islam",
          statusPerkawinan: "Kawin",
        },
      }),
    });
    assertEqual(addM1Res.status, 201, "Add Anggota 1 status 201");
    m1Id = addM1Res.body?.data?.id;

    // 3. Tambah Anggota 2 (Anak) TANPA mengirimkan urutanKk
    const addM2Res = await client.request(`/api/kk/${kkId}/anggota`, {
      method: "POST",
      headers: client.getAuthHeaders(),
      body: JSON.stringify({
        mode: "create",
        shdk: "ANAK",
        penduduk: {
          nik: nikAnggota2,
          namaLengkap: "Anak Sekuensial",
          tempatLahir: "Kedungsumur",
          tanggalLahir: "2012-12-12",
          jenisKelamin: "Laki-laki",
          agama: "Islam",
          statusPerkawinan: "Belum Kawin",
        },
      }),
    });
    assertEqual(addM2Res.status, 201, "Add Anggota 2 status 201");
    m2Id = addM2Res.body?.data?.id;

    // VERIFIKASI:
    await runner.step("POST /api/kk/:id/anggota secara otomatis memberi urutanKk sekuensial (2, 3) jika tidak ditentukan", async () => {
      const getM1 = await client.request(`/api/penduduk/${m1Id}`, {
        headers: client.getAuthHeaders(),
      });
      assertEqual(getM1.status, 200, "Get M1 status 200");
      assertEqual(
        getM1.body?.data?.urutanKk,
        "2",
        "Anggota kedua (Istri) harus otomatis mendapat urutanKk '2'"
      );

      const getM2 = await client.request(`/api/penduduk/${m2Id}`, {
        headers: client.getAuthHeaders(),
      });
      assertEqual(getM2.status, 200, "Get M2 status 200");
      assertEqual(
        getM2.body?.data?.urutanKk,
        "3",
        "Anggota ketiga (Anak) harus otomatis mendapat urutanKk '3'"
      );
    });

  } finally {
    if (m2Id) {
      await client.request(`/api/penduduk/${m2Id}`, {
        method: "DELETE",
        headers: client.getAuthHeaders(false),
      });
    }
    if (m1Id) {
      await client.request(`/api/penduduk/${m1Id}`, {
        method: "DELETE",
        headers: client.getAuthHeaders(false),
      });
    }
    if (kepalaId) {
      await client.request(`/api/penduduk/${kepalaId}`, {
        method: "DELETE",
        headers: client.getAuthHeaders(false),
      });
    }
    if (kkId) {
      await client.request(`/api/kk/${kkId}`, {
        method: "DELETE",
        headers: client.getAuthHeaders(false),
      });
    }
  }

  if (!providedRunner) {
    runner.printSummary();
  }
}

if (process.argv[1]?.endsWith("member-sequence-validation.test.ts")) {
  runMemberSequenceTests().catch((err) => {
    console.error("FATAL ERROR:", err);
    process.exit(1);
  });
}
