import { defineConfig } from "tsup";

export default defineConfig({
  format: ["esm"],
  sourcemap: true,
  clean: true,
  entry: {
    index: "src/index.ts",
  },
});
