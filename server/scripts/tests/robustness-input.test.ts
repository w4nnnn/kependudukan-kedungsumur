import { TestClient, TestRunner } from "./client.js";
import { assert, assertEqual } from "./assertions.js";
import { config, colors, generate16Digits } from "./config.js";

export async function runRobustnessInputTests(providedClient?: TestClient, providedRunner?: TestRunner) {
  const runner = providedRunner || new TestRunner();
  const client = providedClient || new TestClient();

  console.log(`\n${colors.bright}10. Robustness SQL, Input Sanitization & Search 16-Digit KK (Prioritas 3)${colors.reset}`);

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
  const nik1 = generate16Digits("3573");
  const nik2 = generate16Digits("3573");

  let kkId = "";
  let p1Id = "";
  let p2Id = "";

  try {
    // 1. Setup KK
    const createKkRes = await client.request("/api/kk", {
      method: "POST",
      headers: client.getAuthHeaders(),
      body: JSON.stringify({
        noKk,
        alamat: "Jl. Robustness No. 1",
        rt: "001",
        rw: "001",
        modeKepala: "create",
        newPenduduk: {
          nik: nik1,
          namaLengkap: "Warga Kepala Robustness",
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
    p1Id = createKkRes.body?.data?.kepalaKeluargaId;

    // 2. Tambah anggota dengan urutanKk non-numeric "1-A"
    const addAnggotaRes = await client.request(`/api/kk/${kkId}/anggota`, {
      method: "POST",
      headers: client.getAuthHeaders(),
      body: JSON.stringify({
        mode: "create",
        urutanKk: "1-A",
        penduduk: {
          nik: nik2,
          namaLengkap: "Warga Anggota Robustness",
          tempatLahir: "Kedungsumur",
          tanggalLahir: "1985-05-05",
          jenisKelamin: "Perempuan",
          agama: "Islam",
          statusPerkawinan: "Kawin",
        },
      }),
    });
    assertEqual(addAnggotaRes.status, 201, "Setup anggota dengan urutanKk '1-A' status 201");
    p2Id = addAnggotaRes.body?.data?.id;

    // TEST 1: GET /api/kk, GET /api/kk/:id, GET /api/penduduk/:id tidak boleh 500 saat urutanKk non-numeric
    await runner.step("GET /api/kk/:id & GET /api/kk tidak crash 500 saat urutanKk non-numeric ('1-A')", async () => {
      const getKkRes = await client.request(`/api/kk/${kkId}`, {
        headers: client.getAuthHeaders(),
      });
      assertEqual(getKkRes.status, 200, "GET /api/kk/:id status harus 200 (bukan 500 SQL cast error)");
      assert(Boolean(getKkRes.body?.data?.anggota), "Daftar anggota harus berhasil di-load");

      const listKkRes = await client.request(`/api/kk?search=${noKk}`, {
        headers: client.getAuthHeaders(),
      });
      assertEqual(listKkRes.status, 200, "GET /api/kk status harus 200");

      const getPendudukRes = await client.request(`/api/penduduk/${p2Id}`, {
        headers: client.getAuthHeaders(),
      });
      assertEqual(getPendudukRes.status, 200, "GET /api/penduduk/:id status harus 200");
    });

    // TEST 2: GET /api/penduduk?search={16 digit noKk} harus menemukan anggota yang terhubung dengan No KK tersebut
    await runner.step("GET /api/penduduk?search=16digitNoKk dapat menemukan anggota keluarga berdasarkan No KK", async () => {
      const searchRes = await client.request(`/api/penduduk?search=${noKk}`, {
        headers: client.getAuthHeaders(),
      });
      assertEqual(searchRes.status, 200, "Search 16 digit No KK status 200");
      const list = searchRes.body?.data || [];
      assert(list.length >= 2, `Harus menemukan minimal 2 anggota KK untuk noKk ${noKk}, ditemukan: ${list.length}`);
      const foundP1 = list.some((p: any) => p.id === p1Id);
      const foundP2 = list.some((p: any) => p.id === p2Id);
      assert(foundP1 && foundP2, "Kedua anggota keluarga harus ditemukan saat mencari nomor KK 16 digit");
    });

  } finally {
    if (p2Id) {
      await client.request(`/api/penduduk/${p2Id}`, {
        method: "DELETE",
        headers: client.getAuthHeaders(false),
      });
    }
    if (p1Id) {
      await client.request(`/api/penduduk/${p1Id}`, {
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

if (process.argv[1]?.endsWith("robustness-input.test.ts")) {
  runRobustnessInputTests().catch((err) => {
    console.error("FATAL ERROR:", err);
    process.exit(1);
  });
}
