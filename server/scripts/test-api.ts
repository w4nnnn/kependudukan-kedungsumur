import { config, colors } from "./tests/config.js";
import { TestClient, TestRunner } from "./tests/client.js";
import { assertEqual, assertType, assert } from "./tests/assertions.js";
import { runAuthTests, runSignOutTests } from "./tests/auth.test.js";
import { runPendudukTests } from "./tests/penduduk.test.js";
import { runKKTests } from "./tests/kk.test.js";
import { runStatsTests } from "./tests/stats.test.js";

async function main() {
  const client = new TestClient();
  const runner = new TestRunner();

  console.log(`\n${colors.bright}${colors.blue}====================================================${colors.reset}`);
  console.log(`${colors.bright}  API TEST SUITE - SISTEM KEPENDUDUKAN KEDUNGSUMUR  ${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}====================================================${colors.reset}`);
  console.log(`${colors.dim}Target URL : ${config.baseUrl}${colors.reset}`);
  console.log(`${colors.dim}Admin User : ${config.adminUsername}${colors.reset}`);
  console.log(`${colors.dim}Timestamp  : ${new Date().toLocaleString("id-ID")}${colors.reset}\n`);

  // 1. Public & Server Status
  console.log(`${colors.bright}1. Public & Server Status${colors.reset}`);
  await runner.step("GET / (Root Welcome Message & Contract)", async () => {
    const res = await client.request("/");
    assertEqual(res.status, 200, "HTTP Status");
    assertType(res.body, "object", "response body");
    assertType(res.body.message, "string", "response.message");
    assert(
      res.body.message.includes("Selamat Datang di API Kependudukan Desa Kedungsumur"),
      `Pesan selamat datang tidak sesuai: "${res.body.message}"`
    );
  });

  await runAuthTests(client, runner);
  await runPendudukTests(client, runner);
  await runKKTests(client, runner);
  await runStatsTests(client, runner);
  await runSignOutTests(client, runner);

  runner.printSummary();
}

main().catch((error) => {
  console.error(`\n${colors.red}FATAL ERROR:${colors.reset}`, error);
  process.exit(1);
});
