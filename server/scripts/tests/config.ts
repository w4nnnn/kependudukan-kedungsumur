import "dotenv/config";

export interface TestConfig {
  baseUrl: string;
  adminUsername: string;
  adminPassword: string;
}

export const config: TestConfig = {
  baseUrl: process.env.BETTER_AUTH_URL || `http://localhost:${process.env.PORT || 4000}`,
  adminUsername: process.env.TEST_ADMIN_USERNAME || "admin",
  adminPassword: process.env.TEST_ADMIN_PASSWORD || "admin123",
};

export const colors = {
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

export function generate16Digits(prefix = "3573"): string {
  let result = prefix;
  while (result.length < 16) {
    result += Math.floor(Math.random() * 10).toString();
  }
  return result;
}
