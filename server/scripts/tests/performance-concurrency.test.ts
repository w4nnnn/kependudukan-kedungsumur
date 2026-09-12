import { TestClient, TestRunner } from "./client.js";
import { assert, assertEqual } from "./assertions.js";
import { config, colors } from "./config.js";

export async function runPerformanceConcurrencyTests(providedClient?: TestClient, providedRunner?: TestRunner) {
  const runner = providedRunner || new TestRunner();
  const client = providedClient || new TestClient();

  console.log(`\n${colors.bright}11. Concurrency & Connection Pool Resilience (/api/stats) (Prioritas 4)${colors.reset}`);

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

  await runner.step("GET /api/stats (5 Concurrent Requests Tanpa Connection Pool Starvation)", async () => {
    const requests = Array.from({ length: 5 }).map(() =>
      client.request("/api/stats", {
        headers: client.getAuthHeaders(false),
      })
    );

    const startTime = Date.now();
    const responses = await Promise.all(requests);
    const duration = Date.now() - startTime;

    for (let i = 0; i < responses.length; i++) {
      const res = responses[i]!;
      assertEqual(res.status, 200, `Concurrent request #${i + 1} status 200`);
      assertEqual(res.body?.success, true, `Concurrent request #${i + 1} success`);
      assert(typeof res.body?.data?.summary?.totalPenduduk === "number", "summary totalPenduduk valid");
    }

    assert(duration < 15000, `5 concurrent stats requests must finish within reasonable time (took ${duration}ms)`);
  });

  if (!providedRunner) {
    runner.printSummary();
  }
}

if (process.argv[1]?.endsWith("performance-concurrency.test.ts")) {
  runPerformanceConcurrencyTests().catch((err) => {
    console.error("FATAL ERROR:", err);
    process.exit(1);
  });
}
