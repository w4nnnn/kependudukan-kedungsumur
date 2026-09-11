import { TestClient, TestRunner } from "./client.js";
import { assert, assertEqual, assertType } from "./assertions.js";
import { config, colors } from "./config.js";

export async function runAuthTests(client: TestClient, runner: TestRunner) {
  console.log(`\n${colors.bright}2. Middleware & Proteksi Rute (Akses Tanpa Login)${colors.reset}`);

  await runner.step("GET /api/me tanpa auth (Expect 401 & Error Schema)", async () => {
    const res = await client.request("/api/me");
    assertEqual(res.status, 401, "HTTP Status");
    assertType(res.body, "object", "response body");
    assertType(res.body.error, "string", "response.error");
    assertEqual(res.body.error, "Unauthorized. Anda belum login.", "Pesan error unauthorized");
  });

  await runner.step("GET /api/penduduk tanpa auth (Expect 401 & Error Schema)", async () => {
    const res = await client.request("/api/penduduk");
    assertEqual(res.status, 401, "HTTP Status");
    assertType(res.body, "object", "response body");
    assertType(res.body.error, "string", "response.error");
    assertEqual(res.body.error, "Unauthorized. Anda belum login.", "Pesan error unauthorized");
  });

  console.log(`\n${colors.bright}3. Autentikasi Pengguna (Better Auth)${colors.reset}`);

  await runner.step("POST /api/auth/sign-in/username (Login dengan Password Salah -> Expect Fail)", async () => {
    const res = await client.request("/api/auth/sign-in/username", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Origin": config.baseUrl,
      },
      body: JSON.stringify({
        username: config.adminUsername,
        password: "password_palsu_salah_12345",
      }),
    });

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

  await runner.step("POST /api/auth/sign-in/username (Login Admin Sukses & Response Schema)", async () => {
    const res = await client.request("/api/auth/sign-in/username", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Origin": config.baseUrl,
      },
      body: JSON.stringify({
        username: config.adminUsername,
        password: config.adminPassword,
      }),
    });

    if (res.status !== 200) {
      const err: any = new Error(
        `Login gagal dengan status ${res.status}. Pastikan akun admin '${config.adminUsername}' sudah dibuat (npm run create-admin)`
      );
      err.responseBody = res.body;
      throw err;
    }

    assertType(res.body, "object", "login response");
    assertType(res.body.token, "string", "login.token");
    assert(res.body.token.length > 10, "Token harus berupa non-empty opaque string");
    
    assertType(res.body.user, "object", "login.user");
    assertType(res.body.user.id, "string", "user.id");
    assertType(res.body.user.name, "string", "user.name");
    assertType(res.body.user.email, "string", "user.email");
    assertEqual(res.body.user.username, config.adminUsername, "user.username");
    assertEqual(res.body.user.role, "admin", "user.role");

    client.sessionToken = res.body.token;
    const cookieHeader = res.headers.get("set-cookie");
    if (cookieHeader) {
      client.sessionCookie = cookieHeader;
    }
  });

  await runner.step("GET /api/auth/get-session (Validasi Struktur Sesi Aktif)", async () => {
    const res = await client.request("/api/auth/get-session", {
      headers: client.getAuthHeaders(),
    });
    assertEqual(res.status, 200, "HTTP Status");
    assertType(res.body, "object", "get-session response");
    
    assertType(res.body.session, "object", "session");
    assertType(res.body.session.id, "string", "session.id");
    assertType(res.body.session.token, "string", "session.token");
    assertType(res.body.session.userId, "string", "session.userId");
    assertType(res.body.session.expiresAt, "string", "session.expiresAt");

    assertType(res.body.user, "object", "user");
    assertEqual(res.body.user.id, res.body.session.userId, "user.id vs session.userId");
    assertEqual(res.body.user.username, config.adminUsername, "user.username");
    assertEqual(res.body.user.role, "admin", "user.role");

    const adminUserId = res.body.user.id;
    const getUserRes = await client.request(`/api/auth/admin/get-user?id=${adminUserId}`, {
      headers: client.getAuthHeaders(),
    });
    assertEqual(getUserRes.status, 200, "HTTP Status get-user");
    assertType(getUserRes.body, "object", "response user");
    assertEqual(getUserRes.body.id, adminUserId, "user.id cocok");
  });

  await runner.step("POST /api/auth/admin/create-user & Otorisasi RBAC (Staf Role 'user' Ditolak Akses Rute Admin)", async () => {
    const regularUsername = `staf_${Date.now()}`;
    const regularPassword = "password_staf_123";
    const createRes = await client.request("/api/auth/admin/create-user", {
      method: "POST",
      headers: client.getAuthHeaders(),
      body: JSON.stringify({
        name: "Staf Operator Testing",
        email: `${regularUsername}@desa.test`,
        password: regularPassword,
        role: "user",
        data: {
          username: regularUsername,
        },
      }),
    });

    assertEqual(createRes.status, 200, "Create regular user status");
    const regularUserId = createRes.body?.user?.id || createRes.body?.id;
    assert(Boolean(regularUserId), "Regular user ID harus ada");

    const regularClient = new TestClient();
    const loginRes = await regularClient.request("/api/auth/sign-in/username", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Origin": config.baseUrl,
      },
      body: JSON.stringify({
        username: regularUsername,
        password: regularPassword,
      }),
    });
    assertEqual(loginRes.status, 200, "Login regular user status");
    regularClient.sessionToken = loginRes.body.token;
    const cookie = loginRes.headers.get("set-cookie");
    if (cookie) regularClient.sessionCookie = cookie;

    const meRes = await regularClient.request("/api/me", {
      headers: regularClient.getAuthHeaders(),
    });
    assertEqual(meRes.status, 200, "Staf bisa akses /api/me");

    const exportRes = await regularClient.request("/api/penduduk/export", {
      headers: regularClient.getAuthHeaders(),
    });
    assertEqual(exportRes.status, 403, "Staf non-admin dilarang export penduduk (Expect 403)");

    const deleteRes = await regularClient.request("/api/penduduk/00000000-0000-0000-0000-000000000000", {
      method: "DELETE",
      headers: regularClient.getAuthHeaders(false),
    });
    assertEqual(deleteRes.status, 403, "Staf non-admin dilarang delete penduduk (Expect 403)");

    const banRes = await client.request("/api/auth/admin/ban-user", {
      method: "POST",
      headers: client.getAuthHeaders(),
      body: JSON.stringify({
        userId: regularUserId,
        banReason: "Pelanggaran SOP",
      }),
    });
    assertEqual(banRes.status, 200, "Admin ban user status");

    const bannedCheckRes = await regularClient.request("/api/me", {
      headers: regularClient.getAuthHeaders(),
    });
    assert(
      bannedCheckRes.status === 401 || bannedCheckRes.status === 403,
      `Akun diblokir harus ditolak (401 session revoked atau 403 forbidden), diterima: ${bannedCheckRes.status}`
    );

    await client.request("/api/auth/admin/remove-user", {
      method: "POST",
      headers: client.getAuthHeaders(),
      body: JSON.stringify({ userId: regularUserId }),
    });
  });

  await runner.step("GET /api/me (Validasi Response Rute Terproteksi)", async () => {
    const res = await client.request("/api/me", {
      headers: client.getAuthHeaders(),
    });
    assertEqual(res.status, 200, "HTTP Status");
    assertType(res.body, "object", "response /api/me");
    assertType(res.body.message, "string", "response.message");
    assertType(res.body.user, "object", "response.user");
    assertEqual(res.body.user.username, config.adminUsername, "user.username");
    assertEqual(res.body.user.role, "admin", "user.role");
  });
}

export async function runSignOutTests(client: TestClient, runner: TestRunner) {
  console.log(`\n${colors.bright}5. Logout & Invalidation Sesi${colors.reset}`);

  await runner.step("POST /api/auth/sign-out (Logout & Validasi Response)", async () => {
    const res = await client.request("/api/auth/sign-out", {
      method: "POST",
      headers: client.getAuthHeaders(false),
    });

    assertEqual(res.status, 200, "HTTP Status");
    assertType(res.body, "object", "sign-out response");
    assertEqual(res.body.success, true, "signout.success");
  });

  await runner.step("GET /api/me setelah sign-out (Expect 401 & Session Terputus)", async () => {
    const res = await client.request("/api/me", {
      headers: client.getAuthHeaders(false),
    });

    assertEqual(res.status, 401, "HTTP Status");
    assertEqual(res.body.error, "Unauthorized. Anda belum login.", "response.error");
  });
}
