import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "src"),
      // `server-only` throws on import outside a Next.js Server Component
      // boundary; vitest runs in plain Node so we map it to a no-op.
      "server-only": path.resolve(__dirname, "tests/mocks/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: [
      "src/**/*.test.ts",
      "src/**/*.test.tsx",
      "tests/unit/**/*.test.ts",
    ],
    exclude: ["node_modules", ".next", "tests/e2e/**"],
  },
});
