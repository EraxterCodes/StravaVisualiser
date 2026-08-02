import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // These tests hit a real (shared, dev-branch) Postgres database rather
    // than mocks, including a single-row credentials table — running test
    // files in parallel would race on that shared state.
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
