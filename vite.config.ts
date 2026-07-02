import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { cpSync, existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "copy-docs",
      configureServer(server) {
        server.middlewares.use((request, response, next) => {
          if (!request.url?.startsWith("/docs/")) {
            next();
            return;
          }

          const docsRoot = resolve(__dirname, "docs");
          const requestedPath = resolve(docsRoot, decodeURIComponent(request.url.replace(/^\/docs\//, "")));
          if (!requestedPath.startsWith(`${docsRoot}\\`) || !existsSync(requestedPath)) {
            next();
            return;
          }

          response.setHeader("Content-Type", "text/markdown; charset=utf-8");
          response.end(readFileSync(requestedPath));
        });
      },
      closeBundle() {
        const source = resolve(__dirname, "docs");
        const target = join(resolve(__dirname, "dist"), "docs");
        if (existsSync(source)) {
          cpSync(source, target, { recursive: true });
        }
      },
    },
  ],
  server: {
    fs: {
      allow: [resolve(__dirname)],
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
  },
});
