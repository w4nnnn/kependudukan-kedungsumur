import { TestClient, TestRunner } from "./client.js";
import { assert, assertEqual } from "./assertions.js";
import { config, colors, generate16Digits } from "./config.js";

export async function runRbacBoundaryTests(providedClient?: TestClient, providedRunner?: TestRunner) {
  const runner = providedRunner || new TestRunner();
  const adminClient = providedClient || new TestClient();

  console.log(`\n${colors.bright}8. Otorisasi Ketat & Isolasi Batas Wilayah RT/RW (RBAC Boundary)${colors.reset}`);

  // Jika admin belum login pada client, login sekarang
  if (!adminClient.sessionToken) {
    const adminLoginRes = await adminClient.request("/api/auth/sign-in/username", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Origin": config.baseUrl },
      body: JSON.stringify({
        username: config.adminUsername,
        password: config.adminPassword,
      }),
    });
    assertEqual(adminLoginRes.status, 200, "Admin login success");
    adminClient.sessionToken = adminLoginRes.body.token;
  }

  // 2. Buat 2 user operator: Operator A (RT 001) dan Operator B (RT 002)
  const timestamp = Date.now();
  const userA_Name = `op_a_${timestamp}`;
  const userB_Name = `op_b_${timestamp}`;
  const commonPassword = "password_operator_123";

  const createOpARes = await adminClient.request("/api/auth/admin/create-user", {
    method: "POST",
    headers: adminClient.getAuthHeaders(),
    body: JSON.stringify({
      name: "Operator RT 001",
      email: `${userA_Name}@desa.test`,
      password: commonPassword,
      role: "user",
      data: { username: userA_Name, rt: "001", rw: "001" },
    }),
  });
  assertEqual(createOpARes.status, 200, "Create Operator A status");
  const userAId = createOpARes.body?.user?.id || createOpARes.body?.id;

  const createOpBRes = await adminClient.request("/api/auth/admin/create-user", {
    method: "POST",
    headers: adminClient.getAuthHeaders(),
    body: JSON.stringify({
      name: "Operator RT 002",
      email: `${userB_Name}@desa.test`,
      password: commonPassword,
      role: "user",
      data: { username: userB_Name, rt: "002", rw: "001" },
    }),
  });
  assertEqual(createOpBRes.status, 200, "Create Operator B status");
  const userBId = createOpBRes.body?.user?.id || createOpBRes.body?.id;

  // Login Operator A
  const clientA = new TestClient();
  const loginARes = await clientA.request("/api/auth/sign-in/username", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Origin": config.baseUrl },
    body: JSON.stringify({ username: userA_Name, password: commonPassword }),
  });
  assertEqual(loginARes.status, 200, "Login Operator A");
  clientA.sessionToken = loginARes.body.token;

  // Setup data uji di RT 001 dan RT 002 oleh Admin
  const nikA = generate16Digits("3573");
  const noKkA = generate16Digits("3573");
  const residentARes = await adminClient.request("/api/penduduk", {
    method: "POST",
    headers: adminClient.getAuthHeaders(),
    body: JSON.stringify({
      nik: nikA,
      noKk: noKkA,
      namaLengkap: "Warga Asli RT 001",
      jenisKelamin: "Laki-laki",
      tempatLahir: "Kedungsumur",
      tanggalLahir: "1990-01-01",
      alamat: "Jl. RT 001",
      rt: "001",
      rw: "001",
      agama: "Islam",
      statusPerkawinan: "Kawin",
      shdk: "KEPALA KELUARGA",
      createKk: { noKk: noKkA, alamat: "Jl. RT 001", rt: "001", rw: "001" },
    }),
  });
  assertEqual(residentARes.status, 201, "Setup warga RT 001");
  const residentAId = residentARes.body?.data?.id;
  const kAId = residentARes.body?.data?.kartuKeluargaId;

  const nikB = generate16Digits("3573");
  const noKkB = generate16Digits("3573");
  const residentBRes = await adminClient.request("/api/penduduk", {
    method: "POST",
    headers: adminClient.getAuthHeaders(),
    body: JSON.stringify({
      nik: nikB,
      noKk: noKkB,
      namaLengkap: "Warga Asli RT 002",
      jenisKelamin: "Laki-laki",
      tempatLahir: "Kedungsumur",
      tanggalLahir: "1991-01-01",
      alamat: "Jl. RT 002",
      rt: "002",
      rw: "001",
      agama: "Islam",
      statusPerkawinan: "Kawin",
      shdk: "KEPALA KELUARGA",
      createKk: { noKk: noKkB, alamat: "Jl. RT 002", rt: "002", rw: "001" },
    }),
  });
  assertEqual(residentBRes.status, 201, "Setup warga RT 002");
  const residentBId = residentBRes.body?.data?.id;
  const kBId = residentBRes.body?.data?.kartuKeluargaId;

  try {
    // TEST 1: GET /api/stats isolasi
    await runner.step("GET /api/stats?rt=002 oleh Operator RT 001 harus ditolak (Expect 403)", async () => {
      const res = await clientA.request("/api/stats?rt=002", {
        headers: clientA.getAuthHeaders(),
      });
      assertEqual(res.status, 403, "Operator RT 001 query stats RT 002 harus 403");
    });

    await runner.step("GET /api/stats (tanpa parameter rt) oleh Operator RT 001 harus terisolasi ke RT 001", async () => {
      const res = await clientA.request("/api/stats", {
        headers: clientA.getAuthHeaders(),
      });
      assertEqual(res.status, 200, "Operator RT 001 query stats 200");
      const rtList = res.body?.data?.distribusiRt || [];
      const hasOtherRt = rtList.some((item: any) => item.rt !== "001");
      assert(!hasOtherRt, "Stats distribusi RT tidak boleh memuat RT selain 001 untuk operator RT 001");
    });

    await runner.step("GET /api/stats/pdf?rt=002 oleh Operator RT 001 harus ditolak (Expect 403)", async () => {
      const res = await clientA.request("/api/stats/pdf?rt=002", {
        headers: clientA.getAuthHeaders(),
      });
      assertEqual(res.status, 403, "Operator RT 001 unduh PDF stats RT 002 harus 403");
    });

    // TEST 2: PUT /api/penduduk/:id boundary check
    await runner.step("PUT /api/penduduk/:id mengubah rt ke '002' oleh Operator RT 001 harus ditolak (Expect 403)", async () => {
      const res = await clientA.request(`/api/penduduk/${residentAId}`, {
        method: "PUT",
        headers: clientA.getAuthHeaders(),
        body: JSON.stringify({ rt: "002" }),
      });
      assertEqual(res.status, 403, "Mengubah rt ke luar wilayah harus 403");
    });

    await runner.step("PUT /api/penduduk/:id memindahkan ke kartuKeluargaId RT 002 oleh Operator RT 001 harus ditolak (Expect 403)", async () => {
      const res = await clientA.request(`/api/penduduk/${residentAId}`, {
        method: "PUT",
        headers: clientA.getAuthHeaders(),
        body: JSON.stringify({ kartuKeluargaId: kBId }),
      });
      assertEqual(res.status, 403, "Memindahkan ke KK RT lain harus 403");
    });

    // TEST 3: PUT /api/kk/:id boundary check
    await runner.step("PUT /api/kk/:id mengubah rt ke '002' oleh Operator RT 001 harus ditolak (Expect 403)", async () => {
      const res = await clientA.request(`/api/kk/${kAId}`, {
        method: "PUT",
        headers: clientA.getAuthHeaders(),
        body: JSON.stringify({ rt: "002" }),
      });
      assertEqual(res.status, 403, "Mengubah RT KK ke luar wilayah harus 403");
    });

    // TEST 4: POST /api/kk mode 'select' memilih penduduk luar RT
    await runner.step("POST /api/kk mode 'select' memilih penduduk RT 002 oleh Operator RT 001 harus ditolak (Expect 403)", async () => {
      const newNoKk = generate16Digits("3573");
      const res = await clientA.request("/api/kk", {
        method: "POST",
        headers: clientA.getAuthHeaders(),
        body: JSON.stringify({
          noKk: newNoKk,
          alamat: "Jl. Baru RT 001",
          rt: "001",
          rw: "001",
          modeKepala: "select",
          selectedPendudukId: residentBId,
        }),
      });
      assertEqual(res.status, 403, "Memilih kepala keluarga dari luar RT harus 403");
    });

    // TEST 5: POST /api/kk/:id/anggota mode 'select' memilih penduduk luar RT
    await runner.step("POST /api/kk/:id/anggota mode 'select' memilih warga RT 002 oleh Operator RT 001 harus ditolak (Expect 403)", async () => {
      const res = await clientA.request(`/api/kk/${kAId}/anggota`, {
        method: "POST",
        headers: clientA.getAuthHeaders(),
        body: JSON.stringify({
          mode: "select",
          pendudukId: residentBId,
          shdk: "FAMILI LAIN",
        }),
      });
      assertEqual(res.status, 403, "Menambahkan anggota dari luar RT harus 403");
    });

    // TEST 6: POST /api/penduduk mengaitkan kartuKeluargaId luar RT
    await runner.step("POST /api/penduduk dengan kartuKeluargaId RT 002 oleh Operator RT 001 harus ditolak (Expect 403)", async () => {
      const newNik = generate16Digits("3573");
      const res = await clientA.request("/api/penduduk", {
        method: "POST",
        headers: clientA.getAuthHeaders(),
        body: JSON.stringify({
          nik: newNik,
          namaLengkap: "Warga Penyelundup",
          jenisKelamin: "Laki-laki",
          tempatLahir: "Kedungsumur",
          tanggalLahir: "1995-05-05",
          alamat: "Jl. RT 001",
          rt: "001",
          rw: "001",
          agama: "Islam",
          statusPerkawinan: "Belum Kawin",
          kartuKeluargaId: kBId,
        }),
      });
      assertEqual(res.status, 403, "Mengaitkan penduduk baru ke KK luar RT harus 403");
    });

  } finally {
    // Cleanup
    if (residentAId) {
      await adminClient.request(`/api/penduduk/${residentAId}`, {
        method: "DELETE",
        headers: adminClient.getAuthHeaders(false),
      });
    }
    if (residentBId) {
      await adminClient.request(`/api/penduduk/${residentBId}`, {
        method: "DELETE",
        headers: adminClient.getAuthHeaders(false),
      });
    }
    if (kAId) {
      await adminClient.request(`/api/kk/${kAId}`, {
        method: "DELETE",
        headers: adminClient.getAuthHeaders(false),
      });
    }
    if (kBId) {
      await adminClient.request(`/api/kk/${kBId}`, {
        method: "DELETE",
        headers: adminClient.getAuthHeaders(false),
      });
    }
    if (userAId) {
      await adminClient.request("/api/auth/admin/remove-user", {
        method: "POST",
        headers: adminClient.getAuthHeaders(),
        body: JSON.stringify({ userId: userAId }),
      });
    }
    if (userBId) {
      await adminClient.request("/api/auth/admin/remove-user", {
        method: "POST",
        headers: adminClient.getAuthHeaders(),
        body: JSON.stringify({ userId: userBId }),
      });
    }
  }

  if (!providedRunner) {
    runner.printSummary();
  }
}

// Support direct execution via CLI
if (process.argv[1]?.endsWith("rbac-boundary.test.ts")) {
  runRbacBoundaryTests().catch((err) => {
    console.error("FATAL ERROR:", err);
    process.exit(1);
  });
}
