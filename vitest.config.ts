import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "app/**/*.test.ts?(x)"],
    pool: "threads",
    reporters: process.env.CI ? ["default"] : ["default"],
    coverage: {
      enabled: false,
    },
  },
});
