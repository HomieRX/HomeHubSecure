import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    include: ["server/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@server": path.resolve(rootDir, "server"),
      "@shared": path.resolve(rootDir, "shared"),
      "@": path.resolve(rootDir, "client", "src"),
    },
  },
});
