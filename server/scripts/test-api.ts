import "dotenv/config";

// ============================================================================
// KONFIGURASI ENVIRONMENT & KREDENSIAL
// ============================================================================
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
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

let passedTests = 0;
let failedTests = 0;
const totalStartTime = Date.now();

// State sesi & data testing
let sessionCookie = "";
let sessionToken = "";
let createdPendudukId = "";

// ============================================================================
// ASSERTION ENGINE & RESPONSE VALIDATORS
// ============================================================================

class AssertionError extends Error {
  constructor(
    message: string,
    public fieldPath?: string,
    public expected?: any,
    public actual?: any
  ) {
    super(message);
    this.name = "AssertionError";
  }
}

/**
 * Memastikan nilai truthy
 */
function assert(condition: boolean, message: string, fieldPath?: string): asserts condition {
  if (!condition) {
    throw new AssertionError(message, fieldPath);
  }
}

/**
 * Membandingkan kesamaan nilai (primitif)
 */
function assertEqual<T>(actual: T, expected: T, fieldDescription: string) {
  if (actual !== expected) {
    throw new AssertionError(
      `${fieldDescription} tidak cocok. Ekspektasi: ${JSON.stringify(expected)}, Diterima: ${JSON.stringify(actual)}`,
      fieldDescription,
      expected,
      actual
    );
  }
}

/**
 * Memeriksa tipe data suatu field
 */
function assertType(value: any, expectedType: "string" | "number" | "boolean" | "object" | "array", fieldName: string) {
  if (expectedType === "array") {
    if (!Array.isArray(value)) {
      throw new AssertionError(
        `Field '${fieldName}' harus bertipe Array, tetapi menerima tipe ${typeof value}`,
        fieldName,
        "Array",
        typeof value
      );
    }
    return;
  }

  if (value === null || value === undefined) {
    throw new AssertionError(
      `Field '${fieldName}' tidak boleh null/undefined (ekspektasi tipe: ${expectedType})`,
      fieldName,
      expectedType,
      value
    );
  }

  const actualType = typeof value;
  if (actualType !== expectedType) {
    throw new AssertionError(
      `Field '${fieldName}' harus bertipe ${expectedType}, tetapi menerima tipe ${actualType} (${JSON.stringify(value)})`,
      fieldName,
      expectedType,
      actualType
    );
  }
}

/**
 * Memeriksa format UUID (v4)
 */
function assertUUID(value: any, fieldName: string) {
  assertType(value, "string", fieldName);
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    throw new AssertionError(
      `Field '${fieldName}' bukan format UUID yang valid: "${value}"`,
      fieldName,
      "Valid UUID format",
      value
    );
  }
}

/**
 * Memeriksa format Tanggal (YYYY-MM-DD)
 */
function assertDateFormat(value: any, fieldName: string) {
  assertType(value, "string", fieldName);
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(value)) {
    throw new AssertionError(
      `Field '${fieldName}' harus berupa format tanggal YYYY-MM-DD, diterima: "${value}"`,
      fieldName,
      "YYYY-MM-DD",
      value
    );
  }
}

/**
 * Memeriksa struktur objek Penduduk lengkap sesuai schema API
 */
function validatePendudukSchema(item: any, contextName = "data") {
  assertType(item, "object", contextName);
  assertUUID(item.id, `${contextName}.id`);
  assertType(item.nik, "string", `${contextName}.nik`);
  assert(item.nik.length === 16, `Field '${contextName}.nik' harus 16 digit, didapat: ${item.nik.length}`);
  
  assertType(item.noKk, "string", `${contextName}.noKk`);
  assert(item.noKk.length === 16, `Field '${contextName}.noKk' harus 16 digit, didapat: ${item.noKk.length}`);
  
  assertType(item.namaLengkap, "string", `${contextName}.namaLengkap`);
  assertType(item.tempatLahir, "string", `${contextName}.tempatLahir`);
  assertDateFormat(item.tanggalLahir, `${contextName}.tanggalLahir`);
  assertType(item.jenisKelamin, "string", `${contextName}.jenisKelamin`);
  assertType(item.alamat, "string", `${contextName}.alamat`);
  assertType(item.rt, "string", `${contextName}.rt`);
  assertType(item.rw, "string", `${contextName}.rw`);
  assertType(item.agama, "string", `${contextName}.agama`);
  assertType(item.statusPerkawinan, "string", `${contextName}.statusPerkawinan`);
  
  if (item.pekerjaan !== null && item.pekerjaan !== undefined) {
    assertType(item.pekerjaan, "string", `${contextName}.pekerjaan`);
  }

  // Validasi blind index hash jika ada (sha256 = 64 hex chars)
  if (item.nikHash) {
    assertType(item.nikHash, "string", `${contextName}.nikHash`);
    assert(item.nikHash.length === 64, `Field '${contextName}.nikHash' harus berukuran 64 karakter hash`);
  }
  if (item.noKkHash) {
    assertType(item.noKkHash, "string", `${contextName}.noKkHash`);
    assert(item.noKkHash.length === 64, `Field '${contextName}.noKkHash' harus berukuran 64 karakter hash`);
  }
}

/**
 * Memeriksa struktur pagination meta
 */
function validatePaginationMeta(meta: any) {
  assertType(meta, "object", "meta");
  assertType(meta.total, "number", "meta.total");
  assertType(meta.page, "number", "meta.page");
  assertType(meta.limit, "number", "meta.limit");
  assertType(meta.totalPages, "number", "meta.totalPages");
  
  assert(meta.page >= 1, `meta.page harus >= 1, diterima: ${meta.page}`);
  assert(meta.limit >= 1, `meta.limit harus >= 1, diterima: ${meta.limit}`);
  assert(meta.total >= 0, `meta.total harus >= 0, diterima: ${meta.total}`);

  const expectedTotalPages = Math.ceil(meta.total / meta.limit);
  assertEqual(meta.totalPages, expectedTotalPages, "meta.totalPages");
}

// ============================================================================
// HELPER NETWORK & RUNNER
// ============================================================================

function generate16Digits(prefix = "3573"): string {
  let result = prefix;
  while (result.length < 16) {
    result += Math.floor(Math.random() * 10).toString();
  }
  return result;
}

const testNik = generate16Digits("3573");
const testNoKk = generate16Digits("3573");

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
  
  // Tangkap Cookie sesi dari Set-Cookie
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
    if (error.fieldPath) {
      console.error(`    ${colors.yellow}Failed Field:${colors.reset} ${error.fieldPath}`);
    }
    if (error.responseBody !== undefined) {
      console.error(`    ${colors.yellow}Response Body:${colors.reset}`, JSON.stringify(error.responseBody, null, 2));
    }
    failedTests++;
  }
}

// ============================================================================
// MAIN TEST SUITE
// ============================================================================

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

  await runStep("GET / (Root Welcome Message & Contract)", async () => {
    const res = await apiRequest("/");
    assertEqual(res.status, 200, "HTTP Status");
    assertType(res.body, "object", "response body");
    assertType(res.body.message, "string", "response.message");
    assert(
      res.body.message.includes("Selamat Datang di API Kependudukan Desa Kedungsumur"),
      `Pesan selamat datang tidak sesuai: "${res.body.message}"`
    );
  });

  // ==========================================
  // SECTION 2: MIDDLEWARE & SECURITY (UNAUTHORIZED ACCESS)
  // ==========================================
  console.log(`\n${colors.bright}2. Middleware & Proteksi Rute (Akses Tanpa Login)${colors.reset}`);

  await runStep("GET /api/me tanpa auth (Expect 401 & Error Schema)", async () => {
    const res = await apiRequest("/api/me");
    assertEqual(res.status, 401, "HTTP Status");
    assertType(res.body, "object", "response body");
    assertType(res.body.error, "string", "response.error");
    assertEqual(res.body.error, "Unauthorized. Anda belum login.", "Pesan error unauthorized");
  });

  await runStep("GET /api/penduduk tanpa auth (Expect 401 & Error Schema)", async () => {
    const res = await apiRequest("/api/penduduk");
    assertEqual(res.status, 401, "HTTP Status");
    assertType(res.body, "object", "response body");
    assertType(res.body.error, "string", "response.error");
    assertEqual(res.body.error, "Unauthorized. Anda belum login.", "Pesan error unauthorized");
  });

  // ==========================================
  // SECTION 3: AUTHENTICATION (LOGIN, SESSION, DETEKSI SALAH PASSWORD)
  // ==========================================
  console.log(`\n${colors.bright}3. Autentikasi Pengguna (Better Auth)${colors.reset}`);

  await runStep("POST /api/auth/sign-in/username (Login dengan Password Salah -> Expect Fail)", async () => {
    const res = await apiRequest("/api/auth/sign-in/username", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Origin": BASE_URL,
      },
      body: JSON.stringify({
        username: ADMIN_USERNAME,
        password: "password_palsu_salah_12345",
      }),
    });

    // Harus gagal (400 atau 401)
    assert(
      res.status === 400 || res.status === 401,
      `Harusnya status 400/401 untuk password salah, didapat ${res.status}`
    );
    assertType(res.body, "object", "error response body");
    assert(
      res.body.message || res.body.error || res.body.code,
      "Response login gagal harus menyertakan pesan error/code"
    );
  });

  await runStep("POST /api/auth/sign-in/username (Login Admin Sukses & Response Schema)", async () => {
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

    assertType(res.body, "object", "login response");
    assertType(res.body.token, "string", "login.token");
    assert(res.body.token.length > 10, "Token harus berupa non-empty opaque string");
    
    // Validasi objek user
    assertType(res.body.user, "object", "login.user");
    assertType(res.body.user.id, "string", "user.id");
    assertType(res.body.user.name, "string", "user.name");
    assertType(res.body.user.email, "string", "user.email");
    assertEqual(res.body.user.username, ADMIN_USERNAME, "user.username");
    assertEqual(res.body.user.role, "admin", "user.role");

    sessionToken = res.body.token;
    const cookieHeader = res.headers.get("set-cookie");
    if (cookieHeader) {
      sessionCookie = cookieHeader;
    }
  });

  await runStep("GET /api/auth/get-session (Validasi Struktur Sesi Aktif)", async () => {
    const res = await apiRequest("/api/auth/get-session", {
      headers: getAuthHeaders(),
    });
    assertEqual(res.status, 200, "HTTP Status");
    assertType(res.body, "object", "get-session response");
    
    // Cek objek session
    assertType(res.body.session, "object", "session");
    assertType(res.body.session.id, "string", "session.id");
    assertType(res.body.session.token, "string", "session.token");
    assertType(res.body.session.userId, "string", "session.userId");
    assertType(res.body.session.expiresAt, "string", "session.expiresAt");

    // Cek objek user
    assertType(res.body.user, "object", "user");
    assertEqual(res.body.user.id, res.body.session.userId, "user.id vs session.userId");
    assertEqual(res.body.user.username, ADMIN_USERNAME, "user.username");
    assertEqual(res.body.user.role, "admin", "user.role");
  });

  await runStep("GET /api/me (Validasi Response Rute Terproteksi)", async () => {
    const res = await apiRequest("/api/me", {
      headers: getAuthHeaders(),
    });
    assertEqual(res.status, 200, "HTTP Status");
    assertType(res.body, "object", "response /api/me");
    assertType(res.body.message, "string", "response.message");
    assertType(res.body.user, "object", "response.user");
    assertEqual(res.body.user.username, ADMIN_USERNAME, "user.username");
    assertEqual(res.body.user.role, "admin", "user.role");
  });

  // ==========================================
  // SECTION 4: CRUD DATA PENDUDUK & RESPONSE SCHEMA
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

  await runStep("POST /api/penduduk (Tambah Penduduk & Validasi Response Schema)", async () => {
    const res = await apiRequest("/api/penduduk", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(dummyPenduduk),
    });

    assertEqual(res.status, 201, "HTTP Status");
    assertType(res.body, "object", "insert response");
    assertEqual(res.body.success, true, "response.success");
    assertType(res.body.message, "string", "response.message");
    
    // Validasi data yang dikembalikan
    validatePendudukSchema(res.body.data, "response.data");
    assertEqual(res.body.data.nik, dummyPenduduk.nik, "data.nik (auto-decrypted)");
    assertEqual(res.body.data.noKk, dummyPenduduk.noKk, "data.noKk (auto-decrypted)");
    assertEqual(res.body.data.namaLengkap, dummyPenduduk.namaLengkap, "data.namaLengkap");
    assertEqual(res.body.data.pekerjaan, dummyPenduduk.pekerjaan, "data.pekerjaan");

    createdPendudukId = res.body.data.id;
  });

  await runStep("POST /api/penduduk (Validasi NIK Duplikat -> Expect 400 & Error Schema)", async () => {
    const res = await apiRequest("/api/penduduk", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(dummyPenduduk),
    });

    assertEqual(res.status, 400, "HTTP Status");
    assertType(res.body, "object", "error response");
    assertEqual(res.body.success, false, "response.success");
    assertType(res.body.message, "string", "response.message");
    assertEqual(res.body.message, "NIK sudah terdaftar.", "response.message");
  });

  await runStep("GET /api/penduduk/:id (Detail Penduduk & Validasi Dekripsi Otomatis)", async () => {
    const res = await apiRequest(`/api/penduduk/${createdPendudukId}`, {
      headers: getAuthHeaders(false),
    });

    assertEqual(res.status, 200, "HTTP Status");
    assertType(res.body, "object", "detail response");
    assertEqual(res.body.success, true, "response.success");
    
    validatePendudukSchema(res.body.data, "response.data");
    assertEqual(res.body.data.id, createdPendudukId, "data.id");
    assertEqual(res.body.data.nik, dummyPenduduk.nik, "data.nik (dekripsi cocok)");
    assertEqual(res.body.data.noKk, dummyPenduduk.noKk, "data.noKk (dekripsi cocok)");
    assertEqual(res.body.data.namaLengkap, dummyPenduduk.namaLengkap, "data.namaLengkap");
    assertEqual(res.body.data.tempatLahir, dummyPenduduk.tempatLahir, "data.tempatLahir");
    assertEqual(res.body.data.tanggalLahir, dummyPenduduk.tanggalLahir, "data.tanggalLahir");
    assertEqual(res.body.data.alamat, dummyPenduduk.alamat, "data.alamat");
  });

  await runStep("GET /api/penduduk/:id (ID Tidak Ditemukan -> Expect 404 & Error Schema)", async () => {
    const nonExistentId = "ffffffff-ffff-ffff-ffff-ffffffffffff";
    const res = await apiRequest(`/api/penduduk/${nonExistentId}`, {
      headers: getAuthHeaders(false),
    });

    assertEqual(res.status, 404, "HTTP Status");
    assertType(res.body, "object", "not found response");
    assertEqual(res.body.success, false, "response.success");
    assertEqual(res.body.message, "Data penduduk tidak ditemukan.", "response.message");
  });

  await runStep("GET /api/penduduk (Pencarian, Filter Hash & Struktur Pagination Meta)", async () => {
    // 1. Cari berdasarkan Nama (ILIKE)
    const searchRes = await apiRequest("/api/penduduk?search=Automated Test", {
      headers: getAuthHeaders(false),
    });
    assertEqual(searchRes.status, 200, "HTTP Status Search");
    assertEqual(searchRes.body.success, true, "search.success");
    assertType(searchRes.body.data, "array", "search.data");
    assert(searchRes.body.data.length >= 1, "Hasil pencarian nama minimal ada 1 data");
    validatePaginationMeta(searchRes.body.meta);

    // Validasi bahwa setiap item yang ditemukan mengandung keyword pencarian
    for (const item of searchRes.body.data) {
      validatePendudukSchema(item, "searchItem");
      assert(
        item.namaLengkap.toLowerCase().includes("automated test"),
        `Nama '${item.namaLengkap}' tidak mengandung kata kunci pencarian`
      );
    }

    // 2. Cari spesifik NIK (Blind Indexing Hash)
    const nikRes = await apiRequest(`/api/penduduk?nik=${dummyPenduduk.nik}`, {
      headers: getAuthHeaders(false),
    });
    assertEqual(nikRes.status, 200, "HTTP Status NIK Search");
    assertType(nikRes.body.data, "array", "nikRes.data");
    assertEqual(nikRes.body.data.length, 1, "Hasil pencarian exact NIK harus tepat 1");
    assertEqual(nikRes.body.data[0].nik, dummyPenduduk.nik, "nik data[0]");
    assertEqual(nikRes.body.data[0].id, createdPendudukId, "id data[0]");

    // 3. Cari spesifik No KK (Blind Indexing Hash)
    const kkRes = await apiRequest(`/api/penduduk?nokk=${dummyPenduduk.noKk}`, {
      headers: getAuthHeaders(false),
    });
    assertEqual(kkRes.status, 200, "HTTP Status No KK Search");
    assertType(kkRes.body.data, "array", "kkRes.data");
    assert(kkRes.body.data.length >= 1, "Pencarian No KK minimal menemukan 1 orang");
    assertEqual(kkRes.body.data[0].noKk, dummyPenduduk.noKk, "noKk data[0]");
  });

  await runStep("PUT /api/penduduk/:id (Update Partial & Validasi Schema Response)", async () => {
    const updatedPayload = {
      pekerjaan: "Principal Engineer Kedungsumur",
      statusPerkawinan: "Cerai Hidup",
      rt: "005",
    };

    const res = await apiRequest(`/api/penduduk/${createdPendudukId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(updatedPayload),
    });

    assertEqual(res.status, 200, "HTTP Status");
    assertType(res.body, "object", "update response");
    assertEqual(res.body.success, true, "response.success");
    assertEqual(res.body.message, "Data penduduk berhasil diperbarui.", "response.message");
    
    validatePendudukSchema(res.body.data, "response.data");
    assertEqual(res.body.data.pekerjaan, updatedPayload.pekerjaan, "data.pekerjaan (terupdate)");
    assertEqual(res.body.data.statusPerkawinan, updatedPayload.statusPerkawinan, "data.statusPerkawinan (terupdate)");
    assertEqual(res.body.data.rt, updatedPayload.rt, "data.rt (terupdate)");
    // Field yang tidak diubah tetap sama
    assertEqual(res.body.data.namaLengkap, dummyPenduduk.namaLengkap, "data.namaLengkap (tidak berubah)");
    assertEqual(res.body.data.nik, dummyPenduduk.nik, "data.nik (tidak berubah)");
  });

  await runStep("PUT /api/penduduk/:id (Update ID Tidak Ada -> Expect 404)", async () => {
    const nonExistentId = "ffffffff-ffff-ffff-ffff-ffffffffffff";
    const res = await apiRequest(`/api/penduduk/${nonExistentId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ pekerjaan: "Testing" }),
    });

    assertEqual(res.status, 404, "HTTP Status");
    assertEqual(res.body.success, false, "response.success");
    assertEqual(res.body.message, "Data penduduk tidak ditemukan.", "response.message");
  });

  await runStep("DELETE /api/penduduk/:id (Hapus Penduduk & Validasi Response Schema)", async () => {
    const res = await apiRequest(`/api/penduduk/${createdPendudukId}`, {
      method: "DELETE",
      headers: getAuthHeaders(false),
    });

    assertEqual(res.status, 200, "HTTP Status");
    assertType(res.body, "object", "delete response");
    assertEqual(res.body.success, true, "response.success");
    assertEqual(res.body.message, "Data penduduk berhasil dihapus.", "response.message");
  });

  await runStep("GET /api/penduduk/:id setelah dihapus (Expect 404 & Error Schema)", async () => {
    const res = await apiRequest(`/api/penduduk/${createdPendudukId}`, {
      headers: getAuthHeaders(false),
    });

    assertEqual(res.status, 404, "HTTP Status");
    assertEqual(res.body.success, false, "response.success");
    assertEqual(res.body.message, "Data penduduk tidak ditemukan.", "response.message");
  });

  await runStep("DELETE /api/penduduk/:id dengan ID acak (Expect 404 & Error Schema)", async () => {
    const randomUuid = "00000000-0000-0000-0000-000000000000";
    const res = await apiRequest(`/api/penduduk/${randomUuid}`, {
      method: "DELETE",
      headers: getAuthHeaders(false),
    });

    assertEqual(res.status, 404, "HTTP Status");
    assertEqual(res.body.success, false, "response.success");
    assertEqual(res.body.message, "Data penduduk tidak ditemukan.", "response.message");
  });

  // ==========================================
  // SECTION 5: LOGOUT & SESSION INVALIDATION
  // ==========================================
  console.log(`\n${colors.bright}5. Logout & Invalidation Sesi${colors.reset}`);

  await runStep("POST /api/auth/sign-out (Logout & Validasi Response)", async () => {
    const res = await apiRequest("/api/auth/sign-out", {
      method: "POST",
      headers: getAuthHeaders(false),
    });

    assertEqual(res.status, 200, "HTTP Status");
    assertType(res.body, "object", "sign-out response");
    assertEqual(res.body.success, true, "signout.success");
  });

  await runStep("GET /api/me setelah sign-out (Expect 401 & Session Terputus)", async () => {
    const res = await apiRequest("/api/me", {
      headers: getAuthHeaders(false),
    });

    assertEqual(res.status, 401, "HTTP Status");
    assertEqual(res.body.error, "Unauthorized. Anda belum login.", "response.error");
  });

  // ==========================================
  // RINGKASAN HASIL PENGUJIAN
  // ==========================================
  const totalDuration = ((Date.now() - totalStartTime) / 1000).toFixed(2);
  console.log(`\n${colors.bright}${colors.blue}====================================================${colors.reset}`);
  console.log(`${colors.bright}  RINGKASAN HASIL TEST API & RESPONSE VALIDATION  ${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}====================================================${colors.reset}`);
  console.log(`  Total Pengujian : ${passedTests + failedTests}`);
  console.log(`  ${colors.green}✔ Berhasil (Pass)${colors.reset} : ${passedTests}`);
  console.log(`  ${colors.red}✖ Gagal (Fail)${colors.reset}    : ${failedTests}`);
  console.log(`  Total Waktu     : ${totalDuration} detik\n`);

  if (failedTests > 0) {
    console.log(`${colors.red}${colors.bright}HASIL AKHIR: FAILED ❌${colors.reset}\n`);
    process.exit(1);
  } else {
    console.log(`${colors.green}${colors.bright}HASIL AKHIR: ALL CONTRACT & RESPONSE TESTS PASSED! 🎉${colors.reset}\n`);
    process.exit(0);
  }
}

main().catch((error) => {
  console.error(`\n${colors.red}FATAL ERROR:${colors.reset}`, error);
  process.exit(1);
});
