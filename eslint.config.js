import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import globals from "globals";
import nextPlugin from "@next/eslint-plugin-next";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

const moduleDirname = path.dirname(fileURLToPath(import.meta.url));
const gitignorePath = path.resolve(moduleDirname, ".gitignore");
const gitignorePatterns = fs
  .readFileSync(gitignorePath, "utf8")
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith("#") && !line.startsWith("!"));

const normalizedIgnorePatterns = Array.from(
  new Set([
    ".next/**",
    "node_modules/**",
    ...gitignorePatterns.flatMap((pattern) => {
      const normalized = pattern.startsWith("/") ? pattern.slice(1) : pattern;
      if (!normalized) {
        return [];
      }
      if (normalized.endsWith("/**")) {
        return [normalized];
      }
      if (normalized.endsWith("/")) {
        return [normalized, `${normalized}**`];
      }
      if (normalized.includes("*")) {
        return [normalized];
      }
      return [normalized, `${normalized}/**`];
    }),
  ]),
);

export default defineConfig([
  {
    ignores: normalizedIgnorePatterns,
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },
]);
