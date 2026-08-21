import "dotenv/config";

// Konfigurasi Base URL dan Kredensial
const BASE_URL = process.env.BETTER_AUTH_URL || `http://localhost:${process.env.PORT || 4000}`;
const ADMIN_USERNAME = process.env.TEST_ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || "admin123";

// Helper Warna Terminal
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

let passedTests = 0;
let failedTests = 0;
const totalStartTime = Date.now();

// State penyimpanan sesi pengujian
let sessionCookie = "";
let sessionToken = "";
let createdPendudukId = "";

// Helper untuk generate 16 digit NIK & KK unik untuk testing
function generate16Digits(prefix = "3573"): string {
  let result = prefix;
  while (result.length < 16) {
    result += Math.floor(Math.random() * 10).toString();
  }
  return result;
}

const testNik = generate16Digits("3573");
const testNoKk = generate16Digits("3573");

interface TestResult {
  name: string;
  success: boolean;
  status?: number;
  message?: string;
  error?: any;
}

async function runStep(name: string, fn: () => Promise<void>) {
  const startTime = Date.now();
  process.stdout.write(`  ${colors.cyan}●${colors.reset} ${name} ... `);
  try {
    await fn();
    const duration = Date.now() - startTime;
    process.stdout.write(`\r  ${colors.green}✔${colors.reset} ${name} ${colors.gray}(${duration}ms)${colors.reset}\n`);
    passedTests++;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    process.stdout.write(`\r  ${colors.red}✖${colors.reset} ${name} ${colors.gray}(${duration}ms)${colors.reset}\n`);
    console.error(`    ${colors.red}Error:${colors.reset} ${error.message || error}`);
    if (error.responseBody) {
      console.error(`    ${colors.yellow}Response:${colors.reset}`, JSON.stringify(error.responseBody, null, 2));
    }
    failedTests++;
  }
}

function getAuthHeaders(includeContentType = true) {
  const headers: Record<string, string> = {
    "Origin": BASE_URL,
  };
  if (includeContentType) {
    headers["Content-Type"] = "application/json";
  }
  if (sessionCookie) {
    headers["Cookie"] = sessionCookie;
  }
  if (sessionToken) {
    headers["Authorization"] = `Bearer ${sessionToken}`;
  }
  return headers;
}

async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, options);
  
  // Extract Set-Cookie jika ada
  const setCookie = response.headers.get("set-cookie");
  if (setCookie && !sessionCookie) {
    sessionCookie = setCookie.split(";")[0] || "";
  }

  let body: any = null;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    body = await response.json();
  } else {
    body = await response.text();
  }

  return {
    status: response.status,
    headers: response.headers,
    body,
  };
}

async function main() {
  console.log(`\n${colors.bright}${colors.blue}====================================================${colors.reset}`);
  console.log(`${colors.bright}  API TEST SUITE - SISTEM KEPENDUDUKAN KEDUNGSUMUR  ${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}====================================================${colors.reset}`);
  console.log(`${colors.dim}Target URL : ${BASE_URL}${colors.reset}`);
  console.log(`${colors.dim}Admin User : ${ADMIN_USERNAME}${colors.reset}`);
  console.log(`${colors.dim}Timestamp  : ${new Date().toLocaleString("id-ID")}${colors.reset}\n`);

  // ==========================================
  // SECTION 1: PUBLIC & HEALTH CHECK
  // ==========================================
  console.log(`${colors.bright}1. Public & Server Status${colors.reset}`);

  await runStep("GET / (Root Welcome Message)", async () => {
    const res = await apiRequest("/");
    if (res.status !== 200) throw new Error(`Status ${res.status} != 200`);
    if (!res.body?.message?.includes("Selamat Datang")) {
      throw new Error("Pesan selamat datang tidak sesuai format");
    }
  });

  // ==========================================
  // SECTION 2: MIDDLEWARE SECURITY (UNAUTHORIZED ACCESS)
  // ==========================================
  console.log(`\n${colors.bright}2. Middleware & Proteksi Rute (Akses Tanpa Login)${colors.reset}`);

  await runStep("GET /api/me tanpa auth (Expect 401 Unauthorized)", async () => {
    const res = await apiRequest("/api/me");
    if (res.status !== 401) {
      throw new Error(`Harusnya 401 Unauthorized, tapi didapat ${res.status}`);
    }
  });

  await runStep("GET /api/penduduk tanpa auth (Expect 401 Unauthorized)", async () => {
    const res = await apiRequest("/api/penduduk");
    if (res.status !== 401) {
      throw new Error(`Harusnya 401 Unauthorized, tapi didapat ${res.status}`);
    }
  });

  // ==========================================
  // SECTION 3: AUTHENTICATION (LOGIN & SESSION)
  // ==========================================
  console.log(`\n${colors.bright}3. Autentikasi Pengguna (Better Auth)${colors.reset}`);

  await runStep("POST /api/auth/sign-in/username (Login Admin)", async () => {
    const res = await apiRequest("/api/auth/sign-in/username", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Origin": BASE_URL,
      },
      body: JSON.stringify({
        username: ADMIN_USERNAME,
        password: ADMIN_PASSWORD,
      }),
    });

    if (res.status !== 200) {
      const err: any = new Error(
        `Login gagal dengan status ${res.status}. Pastikan akun admin '${ADMIN_USERNAME}' sudah dibuat (npm run create-admin)`
      );
      err.responseBody = res.body;
      throw err;
    }

    if (res.body?.token) {
      sessionToken = res.body.token;
    }
    
    // Cookie sesi
    const cookieHeader = res.headers.get("set-cookie");
    if (cookieHeader) {
      sessionCookie = cookieHeader;
    }
  });

  await runStep("GET /api/auth/get-session (Cek Sesi Aktif)", async () => {
    const res = await apiRequest("/api/auth/get-session", {
      headers: getAuthHeaders(),
    });
    if (res.status !== 200 || !res.body?.user) {
      const err: any = new Error("Gagal mengambil data sesi aktif");
      err.responseBody = res.body;
      throw err;
    }
  });

  await runStep("GET /api/me (Akses Rute Terproteksi Setelah Login)", async () => {
    const res = await apiRequest("/api/me", {
      headers: getAuthHeaders(),
    });
    if (res.status !== 200) {
      const err: any = new Error(`Status ${res.status} != 200`);
      err.responseBody = res.body;
      throw err;
    }
    if (res.body?.user?.username !== ADMIN_USERNAME) {
      throw new Error(`Username pada rute /api/me tidak cocok: ${res.body?.user?.username}`);
    }
  });

  // ==========================================
  // SECTION 4: CRUD DATA PENDUDUK
  // ==========================================
  console.log(`\n${colors.bright}4. Manajemen Data Penduduk (CRUD & Keamanan Data)${colors.reset}`);

  const dummyPenduduk = {
    nik: testNik,
    noKk: testNoKk,
    namaLengkap: "Budi Santoso Automated Test",
    tempatLahir: "Kedungsumur",
    tanggalLahir: "1995-08-17",
    jenisKelamin: "Laki-laki",
    alamat: "Jl. Merdeka No. 45",
    rt: "001",
    rw: "002",
    agama: "Islam",
    statusPerkawinan: "Kawin",
    pekerjaan: "Software Engineer",
  };

  await runStep("POST /api/penduduk (Tambah Penduduk Baru)", async () => {
    const res = await apiRequest("/api/penduduk", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(dummyPenduduk),
    });

    if (res.status !== 201) {
      const err: any = new Error(`Status ${res.status} != 201 Created`);
      err.responseBody = res.body;
      throw err;
    }

    if (!res.body?.data?.id) {
      throw new Error("Response tidak menyertakan ID penduduk yang baru dibuat");
    }

    createdPendudukId = res.body.data.id;
  });

  await runStep("POST /api/penduduk (Validasi NIK Duplikat -> Expect 400)", async () => {
    const res = await apiRequest("/api/penduduk", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(dummyPenduduk),
    });

    if (res.status !== 400) {
      throw new Error(`Harusnya 400 Bad Request untuk NIK duplikat, didapat ${res.status}`);
    }

    if (!res.body?.message?.includes("NIK sudah terdaftar")) {
      throw new Error(`Pesan error tidak sesuai: "${res.body?.message}"`);
    }
  });

  await runStep("GET /api/penduduk/:id (Detail Penduduk & Dekripsi Otomatis)", async () => {
    const res = await apiRequest(`/api/penduduk/${createdPendudukId}`, {
      headers: getAuthHeaders(),
    });

    if (res.status !== 200) {
      const err: any = new Error(`Status ${res.status} != 200`);
      err.responseBody = res.body;
      throw err;
    }

    const data = res.body?.data;
    if (!data) throw new Error("Data penduduk kosong");
    if (data.nik !== dummyPenduduk.nik) {
      throw new Error(`NIK yang didekripsi (${data.nik}) tidak sama dengan input (${dummyPenduduk.nik})`);
    }
    if (data.namaLengkap !== dummyPenduduk.namaLengkap) {
      throw new Error(`Nama tidak cocok: ${data.namaLengkap}`);
    }
  });

  await runStep("GET /api/penduduk (Pencarian & Paginasi)", async () => {
    // 1. Cari berdasarkan Nama (ILIKE)
    const searchRes = await apiRequest("/api/penduduk?search=Automated Test", {
      headers: getAuthHeaders(),
    });
    if (searchRes.status !== 200 || !searchRes.body?.data?.length) {
      throw new Error("Pencarian berdasarkan search query gagal menemukan data");
    }

    // 2. Cari berdasarkan NIK (Blind Indexing Hash)
    const nikRes = await apiRequest(`/api/penduduk?nik=${dummyPenduduk.nik}`, {
      headers: getAuthHeaders(),
    });
    if (nikRes.status !== 200 || nikRes.body?.data?.length !== 1) {
      throw new Error("Pencarian exact NIK menggunakan Blind Index Hash gagal");
    }

    // 3. Cari berdasarkan No KK
    const kkRes = await apiRequest(`/api/penduduk?nokk=${dummyPenduduk.noKk}`, {
      headers: getAuthHeaders(),
    });
    if (kkRes.status !== 200 || !kkRes.body?.data?.length) {
      throw new Error("Pencarian No KK menggunakan Blind Index Hash gagal");
    }

    // 4. Periksa struktur pagination metadata
    const meta = searchRes.body?.meta;
    if (!meta || typeof meta.total !== "number" || typeof meta.totalPages !== "number") {
      throw new Error("Format meta pagination tidak valid");
    }
  });

  await runStep("PUT /api/penduduk/:id (Update Partial Data)", async () => {
    const updatedPayload = {
      pekerjaan: "Senior Tech Lead",
      statusPerkawinan: "Cerai Hidup",
    };

    const res = await apiRequest(`/api/penduduk/${createdPendudukId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(updatedPayload),
    });

    if (res.status !== 200) {
      const err: any = new Error(`Status ${res.status} != 200`);
      err.responseBody = res.body;
      throw err;
    }

    if (res.body?.data?.pekerjaan !== updatedPayload.pekerjaan) {
      throw new Error("Field pekerjaan gagal diperbarui");
    }
  });

  await runStep("DELETE /api/penduduk/:id (Hapus Penduduk)", async () => {
    const res = await apiRequest(`/api/penduduk/${createdPendudukId}`, {
      method: "DELETE",
      headers: getAuthHeaders(false),
    });

    if (res.status !== 200 || !res.body?.success) {
      const err: any = new Error(`Gagal menghapus data penduduk`);
      err.responseBody = res.body;
      throw err;
    }
  });

  await runStep("GET /api/penduduk/:id setelah dihapus (Expect 404 Not Found)", async () => {
    const res = await apiRequest(`/api/penduduk/${createdPendudukId}`, {
      headers: getAuthHeaders(false),
    });

    if (res.status !== 404) {
      throw new Error(`Harusnya 404 Not Found, didapat ${res.status}`);
    }
  });

  await runStep("DELETE /api/penduduk/:id dengan ID acak (Expect 404 Not Found)", async () => {
    const randomUuid = "00000000-0000-0000-0000-000000000000";
    const res = await apiRequest(`/api/penduduk/${randomUuid}`, {
      method: "DELETE",
      headers: getAuthHeaders(false),
    });

    if (res.status !== 404) {
      throw new Error(`Harusnya 404 Not Found, didapat ${res.status}`);
    }
  });

  // ==========================================
  // SECTION 5: LOGOUT & SESSION INVALIDATION
  // ==========================================
  console.log(`\n${colors.bright}5. Logout & Invalidation Sesi${colors.reset}`);

  await runStep("POST /api/auth/sign-out (Logout)", async () => {
    const res = await apiRequest("/api/auth/sign-out", {
      method: "POST",
      headers: getAuthHeaders(false),
    });

    if (res.status !== 200) {
      const err: any = new Error(`Status ${res.status} != 200`);
      err.responseBody = res.body;
      throw err;
    }
  });

  await runStep("GET /api/me setelah sign-out (Expect 401 Unauthorized)", async () => {
    const res = await apiRequest("/api/me", {
      headers: getAuthHeaders(false),
    });

    if (res.status !== 401) {
      throw new Error(`Sesi masih aktif! Harusnya 401 Unauthorized setelah logout, didapat ${res.status}`);
    }
  });

  // ==========================================
  // RINGKASAN HASIL PENGUJIAN
  // ==========================================
  const totalDuration = ((Date.now() - totalStartTime) / 1000).toFixed(2);
  console.log(`\n${colors.bright}${colors.blue}====================================================${colors.reset}`);
  console.log(`${colors.bright}  RINGKASAN HASIL TEST API${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}====================================================${colors.reset}`);
  console.log(`  Total Pengujian : ${passedTests + failedTests}`);
  console.log(`  ${colors.green}✔ Berhasil (Pass)${colors.reset} : ${passedTests}`);
  console.log(`  ${colors.red}✖ Gagal (Fail)${colors.reset}    : ${failedTests}`);
  console.log(`  Total Waktu     : ${totalDuration} detik\n`);

  if (failedTests > 0) {
    console.log(`${colors.red}${colors.bright}HASIL AKHIR: FAILED ❌${colors.reset}\n`);
    process.exit(1);
  } else {
    console.log(`${colors.green}${colors.bright}HASIL AKHIR: ALL TESTS PASSED! 🎉${colors.reset}\n`);
    process.exit(0);
  }
}

main().catch((error) => {
  console.error(`\n${colors.red}FATAL ERROR:${colors.reset}`, error);
  process.exit(1);
});
