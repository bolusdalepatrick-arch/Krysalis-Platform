import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Database-backed suites (seed integrity, lesson completion) share one
    // Postgres; sequential files keep their row counts from racing.
    fileParallelism: false,
  },
});
