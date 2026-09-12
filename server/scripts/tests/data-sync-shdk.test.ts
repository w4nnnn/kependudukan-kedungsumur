import { TestClient, TestRunner } from "./client.js";
import { assert, assertEqual } from "./assertions.js";
import { config, colors, generate16Digits } from "./config.js";

export async function runDataSyncShdkTests(providedClient?: TestClient, providedRunner?: TestRunner) {
  const runner = providedRunner || new TestRunner();
  const client = providedClient || new TestClient();

  console.log(`\n${colors.bright}9. Sinkronisasi Alamat Keluarga, SHDK & Kepala Keluarga (Prioritas 2)${colors.reset}`);

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

  // Siapkan data: 1 KK dengan 1 Kepala Keluarga dan 1 Anggota (Istri/Anak)
  const noKk = generate16Digits("3573");
  const nikKepala = generate16Digits("3573");
  const nikAnggota = generate16Digits("3573");

  let kkId = "";
  let kepalaId = "";
  let anggotaId = "";

  try {
    // 1. Buat KK dan Kepala Keluarga
    const createKkRes = await client.request("/api/kk", {
      method: "POST",
      headers: client.getAuthHeaders(),
      body: JSON.stringify({
        noKk,
        alamat: "Jl. Awal No. 1",
        rt: "001",
        rw: "001",
        modeKepala: "create",
        newPenduduk: {
          nik: nikKepala,
          namaLengkap: "Bapak Kepala Sinkron",
          tempatLahir: "Kedungsumur",
          tanggalLahir: "1980-01-01",
          jenisKelamin: "Laki-laki",
          agama: "Islam",
          statusPerkawinan: "Kawin",
        },
      }),
    });
    assertEqual(createKkRes.status, 201, "Setup KK + Kepala status 201");
    kkId = createKkRes.body?.data?.id;
    kepalaId = createKkRes.body?.data?.kepalaKeluargaId;
    assert(Boolean(kkId), "KK ID harus ada");
    assert(Boolean(kepalaId), "Kepala Keluarga ID harus ada");

    // 2. Tambah Anggota (Istri)
    const addAnggotaRes = await client.request(`/api/kk/${kkId}/anggota`, {
      method: "POST",
      headers: client.getAuthHeaders(),
      body: JSON.stringify({
        mode: "create",
        shdk: "ISTRI",
        penduduk: {
          nik: nikAnggota,
          namaLengkap: "Ibu Istri Sinkron",
          tempatLahir: "Kedungsumur",
          tanggalLahir: "1985-05-05",
          jenisKelamin: "Perempuan",
          agama: "Islam",
          statusPerkawinan: "Kawin",
        },
      }),
    });
    assertEqual(addAnggotaRes.status, 201, "Setup Anggota status 201");
    anggotaId = addAnggotaRes.body?.data?.id;
    assert(Boolean(anggotaId), "Anggota ID harus ada");

    // TEST 1: Saat Kepala Keluarga diupdate alamat/rt/rw via PUT /api/penduduk/:id,
    // seluruh anggota keluarga di KK tersebut alamat/rt/rw-nya harus ikut tersinkron!
    await runner.step("PUT /api/penduduk/:id (Update Alamat Kepala Keluarga Sinkron ke SELURUH Anggota KK)", async () => {
      const updateRes = await client.request(`/api/penduduk/${kepalaId}`, {
        method: "PUT",
        headers: client.getAuthHeaders(),
        body: JSON.stringify({
          alamat: "Jl. Pindah Baru No. 99",
          rt: "001",
          rw: "001",
        }),
      });
      assertEqual(updateRes.status, 200, "Update Kepala Keluarga status 200");

      // Cek anggota keluarga apakah alamatnya ikut tersinkron
      const anggotaRes = await client.request(`/api/penduduk/${anggotaId}`, {
        headers: client.getAuthHeaders(),
      });
      assertEqual(anggotaRes.status, 200, "Get Anggota status 200");
      assertEqual(
        anggotaRes.body?.data?.alamat,
        "Jl. Pindah Baru No. 99",
        "Alamat anggota keluarga harus otomatis tersinkron dengan Kepala Keluarga"
      );

      // Cek kartu keluarga juga tersinkron
      const kkRes = await client.request(`/api/kk/${kkId}`, {
        headers: client.getAuthHeaders(),
      });
      assertEqual(kkRes.status, 200, "Get KK status 200");
      assertEqual(
        kkRes.body?.data?.alamat,
        "Jl. Pindah Baru No. 99",
        "Alamat pada lembar KK harus otomatis tersinkron"
      );
    });

    // TEST 2: PUT /api/kk/:id dapat menunjuk anggota sebagai Kepala Keluarga baru
    await runner.step("PUT /api/kk/:id dapat menunjuk Kepala Keluarga baru via kepalaKeluargaId", async () => {
      const updateKkRes = await client.request(`/api/kk/${kkId}`, {
        method: "PUT",
        headers: client.getAuthHeaders(),
        body: JSON.stringify({
          kepalaKeluargaId: anggotaId,
        }),
      });
      assertEqual(updateKkRes.status, 200, "Update KK Kepala status 200");

      const kkDetailRes = await client.request(`/api/kk/${kkId}`, {
        headers: client.getAuthHeaders(),
      });
      assertEqual(kkDetailRes.status, 200, "Get KK Detail status 200");
      assertEqual(
        kkDetailRes.body?.data?.kepalaKeluargaId,
        anggotaId,
        "kepalaKeluargaId pada KK harus terupdate ke anggotaId"
      );

      // Anggota baru yang dipromosikan harus memiliki shdk KEPALA KELUARGA
      const anggotaDetailRes = await client.request(`/api/penduduk/${anggotaId}`, {
        headers: client.getAuthHeaders(),
      });
      assertEqual(
        anggotaDetailRes.body?.data?.shdk,
        "KEPALA KELUARGA",
        "Anggota yang ditunjuk sebagai kepala harus berstatus KEPALA KELUARGA"
      );

      // Kepala keluarga lama harus diturunkan statusnya
      const kepalaLamaDetailRes = await client.request(`/api/penduduk/${kepalaId}`, {
        headers: client.getAuthHeaders(),
      });
      assertEqual(
        kepalaLamaDetailRes.body?.data?.shdk,
        "ANGGOTA KELUARGA",
        "Kepala keluarga lama harus diturunkan ke ANGGOTA KELUARGA"
      );
    });

    // TEST 3: POST /api/penduduk dengan kartuKeluargaId tanpa body.noKk tetap sukses dan menyinkronkan noKk dari KK
    await runner.step("POST /api/penduduk dengan kartuKeluargaId tanpa noKk otomatis mengambil noKk dari KK", async () => {
      const nikAnak = generate16Digits("3573");
      const addAnakRes = await client.request("/api/penduduk", {
        method: "POST",
        headers: client.getAuthHeaders(),
        body: JSON.stringify({
          nik: nikAnak,
          namaLengkap: "Anak Kandung",
          tempatLahir: "Kedungsumur",
          tanggalLahir: "2010-10-10",
          jenisKelamin: "Laki-laki",
          alamat: "Jl. Pindah Baru No. 99",
          rt: "001",
          rw: "001",
          agama: "Islam",
          statusPerkawinan: "Belum Kawin",
          shdk: "ANAK",
          kartuKeluargaId: kkId,
        }),
      });
      assertEqual(addAnakRes.status, 201, "Add anak status 201");
      assertEqual(addAnakRes.body?.data?.noKk, noKk, "noKk anak harus otomatis sesuai dengan No KK");
      const anakId = addAnakRes.body?.data?.id;

      if (anakId) {
        await client.request(`/api/penduduk/${anakId}`, {
          method: "DELETE",
          headers: client.getAuthHeaders(false),
        });
      }
    });

  } finally {
    if (anggotaId) {
      await client.request(`/api/penduduk/${anggotaId}`, {
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

if (process.argv[1]?.endsWith("data-sync-shdk.test.ts")) {
  runDataSyncShdkTests().catch((err) => {
    console.error("FATAL ERROR:", err);
    process.exit(1);
  });
}
