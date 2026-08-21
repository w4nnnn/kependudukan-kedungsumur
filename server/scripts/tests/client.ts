import { config, colors } from "./config.js";

export class TestClient {
  public sessionCookie = "";
  public sessionToken = "";

  getAuthHeaders(includeContentType = true): Record<string, string> {
    const headers: Record<string, string> = {
      "Origin": config.baseUrl,
    };
    if (includeContentType) {
      headers["Content-Type"] = "application/json";
    }
    if (this.sessionCookie) {
      headers["Cookie"] = this.sessionCookie;
    }
    if (this.sessionToken) {
      headers["Authorization"] = `Bearer ${this.sessionToken}`;
    }
    return headers;
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${config.baseUrl}${endpoint}`;
    const response = await fetch(url, options);
    
    // Tangkap Set-Cookie jika ada
    const setCookie = response.headers.get("set-cookie");
    if (setCookie && !this.sessionCookie) {
      this.sessionCookie = setCookie.split(";")[0] || "";
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
}

export class TestRunner {
  public passedTests = 0;
  public failedTests = 0;
  public totalStartTime = Date.now();

  async step(name: string, fn: () => Promise<void>) {
    const startTime = Date.now();
    process.stdout.write(`  ${colors.cyan}●${colors.reset} ${name} ... `);
    try {
      await fn();
      const duration = Date.now() - startTime;
      process.stdout.write(`\r  ${colors.green}✔${colors.reset} ${name} ${colors.gray}(${duration}ms)${colors.reset}\n`);
      this.passedTests++;
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
      this.failedTests++;
    }
  }

  printSummary() {
    const totalDuration = ((Date.now() - this.totalStartTime) / 1000).toFixed(2);
    console.log(`\n${colors.bright}${colors.blue}====================================================${colors.reset}`);
    console.log(`${colors.bright}  RINGKASAN HASIL TEST API & RESPONSE VALIDATION  ${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}====================================================${colors.reset}`);
    console.log(`  Total Pengujian : ${this.passedTests + this.failedTests}`);
    console.log(`  ${colors.green}✔ Berhasil (Pass)${colors.reset} : ${this.passedTests}`);
    console.log(`  ${colors.red}✖ Gagal (Fail)${colors.reset}    : ${this.failedTests}`);
    console.log(`  Total Waktu     : ${totalDuration} detik\n`);

    if (this.failedTests > 0) {
      console.log(`${colors.red}${colors.bright}HASIL AKHIR: FAILED ❌${colors.reset}\n`);
      process.exit(1);
    } else {
      console.log(`${colors.green}${colors.bright}HASIL AKHIR: ALL CONTRACT & RESPONSE TESTS PASSED! 🎉${colors.reset}\n`);
      process.exit(0);
    }
  }
}
