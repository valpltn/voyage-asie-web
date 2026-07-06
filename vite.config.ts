import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import obfuscatorPlugin from "vite-plugin-javascript-obfuscator";
import { cpSync, existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

export default defineConfig({
  plugins: [
    react(),
    obfuscatorPlugin({
      apply: "build",
      exclude: [/node_modules/],
      options: {
        compact: true,
        controlFlowFlattening: false,
        deadCodeInjection: false,
        identifierNamesGenerator: "hexadecimal",
        rotateStringArray: true,
        selfDefending: false,
        shuffleStringArray: true,
        splitStrings: true,
        splitStringsChunkLength: 8,
        stringArray: true,
        stringArrayEncoding: ["base64"],
        stringArrayThreshold: 0.75,
      },
    }),
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
  build: {
    sourcemap: false,
    minify: "esbuild",
    cssMinify: true,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
  },
});
