import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 3,
  reporter: "list",
  use: {
    baseURL: "http://localhost:8000",
    trace: "on-first-retry",
    screenshot: "off",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
