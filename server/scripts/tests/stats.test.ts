import { TestClient, TestRunner } from "./client.js";
import { assert, assertEqual, assertType } from "./assertions.js";
import { colors } from "./config.js";

export async function runStatsTests(client: TestClient, runner: TestRunner) {
  console.log(`\n${colors.bright}6. Agregasi Statistik Kependudukan & Demografi (/api/stats)${colors.reset}`);

  await runner.step("GET /api/stats (Ringkasan KPI & Agregasi Demografi)", async () => {
    const res = await client.request("/api/stats", {
      headers: client.getAuthHeaders(false),
    });

    assertEqual(res.status, 200, "HTTP Status");
    assertEqual(res.body.success, true, "response.success");
    assertType(res.body.data, "object", "response.data");

    const { summary, kelompokUsia, distribusiRt, distribusiRw, statusPerkawinan, agama, pekerjaan, shdk } = res.body.data;

    // Validate Summary
    assertType(summary, "object", "data.summary");
    assertType(summary.totalPenduduk, "number", "summary.totalPenduduk");
    assertType(summary.totalKK, "number", "summary.totalKK");
    assertType(summary.totalLakiLaki, "number", "summary.totalLakiLaki");
    assertType(summary.totalPerempuan, "number", "summary.totalPerempuan");
    assertType(summary.rataRataAnggotaKK, "number", "summary.rataRataAnggotaKK");
    assertType(summary.totalUser, "number", "summary.totalUser");

    // Validate Kelompok Usia
    assertType(kelompokUsia, "array", "data.kelompokUsia");
    assertEqual(kelompokUsia.length, 5, "Jumlah kelompok usia harus 5 kategori");

    // Validate Distribusi RT & RW
    assertType(distribusiRt, "array", "data.distribusiRt");
    assertType(distribusiRw, "array", "data.distribusiRw");

    // Validate Status & Demografi
    assertType(statusPerkawinan, "array", "data.statusPerkawinan");
    assertType(agama, "array", "data.agama");
    assertType(pekerjaan, "array", "data.pekerjaan");
    assertType(shdk, "array", "data.shdk");
  });

  await runner.step("GET /api/stats?rt=001&rw=002 (Filter Statistik per Wilayah RT/RW)", async () => {
    const res = await client.request("/api/stats?rt=001&rw=002", {
      headers: client.getAuthHeaders(false),
    });

    assertEqual(res.status, 200, "HTTP Status");
    assertEqual(res.body.success, true, "response.success");
    assertType(res.body.data.summary.totalPenduduk, "number", "summary.totalPenduduk filter");
  });
}
