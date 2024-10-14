import { defineConfig } from "tsup";

export default defineConfig({
  format: ["esm"],
  sourcemap: true,
  minify: true,
  clean: true,
  outDir: "dist/js",
  entry: { index: "src/index.ts" },
});
