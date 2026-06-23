import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Integration test runner. These tests hit the Firestore emulator and so are
// kept OUT of the default `pnpm test` suite (which is pure/isolatable only).
//
// Run them with:
//   pnpm emulators            # in one terminal (needs the Firebase CLI + Java)
//   pnpm test:integration     # in another
//
// Each suite self-skips when FIRESTORE_EMULATOR_HOST is not set, so this is safe
// to run without the emulator up (it just reports 0 / skipped).
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/integration/**/*.itest.ts"],
    // Emulator round-trips are slower than unit tests; give them room.
    testTimeout: 20_000,
    hookTimeout: 20_000,
  },
});
