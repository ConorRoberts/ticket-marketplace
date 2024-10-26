import { defineConfig } from "tsup";

export default defineConfig({
  format: ["esm"],
  sourcemap: true,
  dts: true,
  entry: {
    schema: "src/schema.ts",
    client: "src/client.ts",
    index: "src/index.ts",
    cache: "src/cache.ts",
    scripts: "src/scripts.ts",
    pubsub: "src/pubsub/index.ts",
  },
});
