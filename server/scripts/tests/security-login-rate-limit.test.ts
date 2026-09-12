import { TestClient, TestRunner } from "./client.js";
import { assert, assertEqual } from "./assertions.js";
import { config, colors } from "./config.js";

export async function runSecurityRateLimitTests(providedClient?: TestClient, providedRunner?: TestRunner) {
  const runner = providedRunner || new TestRunner();
  const client = providedClient || new TestClient();

  console.log(`\n${colors.bright}12. Proteksi Keamanan: Security Headers & Brute-Force Rate Limiting (Prioritas 5)${colors.reset}`);

  // TEST 1: Security Headers on Responses
  await runner.step("GET / (Validasi Security Headers X-Content-Type-Options & X-Frame-Options)", async () => {
    const res = await client.request("/");
    assertEqual(res.status, 200, "Root status 200");
    const nosniff = res.headers.get("x-content-type-options");
    assertEqual(nosniff, "nosniff", "x-content-type-options nosniff");
    const frameOptions = res.headers.get("x-frame-options");
    assert(Boolean(frameOptions), "x-frame-options header harus terpasang");
  });

  // TEST 2: Rate Limiting on Sign-in Endpoint
  await runner.step("POST /api/auth/sign-in/username (Rate Limiting Ketat terhadap Brute-Force -> Expect 429)", async () => {
    const bruteForceClient = new TestClient();
    let got429 = false;

    // Lakukan 18 percobaan login cepat
    for (let i = 0; i < 18; i++) {
      const res = await bruteForceClient.request("/api/auth/sign-in/username", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Origin": config.baseUrl,
        },
        body: JSON.stringify({
          username: "random_user_bruteforce",
          password: `wrong_pass_${i}`,
        }),
      });

      if (res.status === 429) {
        got429 = true;
        break;
      }
    }

    assert(got429, "Setelah banyak percobaan login cepat, endpoint sign-in harus melempar HTTP 429");
  });

  if (!providedRunner) {
    runner.printSummary();
  }
}

if (process.argv[1]?.endsWith("security-login-rate-limit.test.ts")) {
  runSecurityRateLimitTests().catch((err) => {
    console.error("FATAL ERROR:", err);
    process.exit(1);
  });
}
