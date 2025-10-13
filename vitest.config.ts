import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    reporters: process.env.CI ? ["default"] : ["default"],
    coverage: {
      enabled: false,
    },
  },
});
