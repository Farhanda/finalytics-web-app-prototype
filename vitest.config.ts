import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// QA test runner config. Tests live in tests/ and exercise the app's pure /
// isolatable functions (business rules, parsers, formatters, auth logic). Modules
// that need a live external service (Firebase, Anthropic, GitHub, Discord) are
// either mocked or intentionally left to integration testing — see QA-STATUS.md.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // A clean, parseable summary plus a JSON file the QA report script reads.
    reporters: ["default", "json"],
    outputFile: { json: "./qa-results.json" },
  },
});
