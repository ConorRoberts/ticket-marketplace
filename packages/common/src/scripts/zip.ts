import { existsSync } from "node:fs";
import * as fs from "node:fs/promises";
import { consola } from "consola";
import JSZip from "jszip";

export const createZip = async (args: {
  inputDir: string;
  outputFile: string;
}) => {
  const buildExists = existsSync(args.outputFile);

  if (buildExists) {
    await fs.rm(args.outputFile);
  }

  const zip = new JSZip();

  const files = await fs.readdir(args.inputDir);

  const jsFiles = files.filter((e) => e.includes(".js"));

  const pkg = await fs.readFile("./package.json");
  zip.file("package.json", pkg.toString("utf-8"));

  for (const name of jsFiles) {
    const f = await fs.readFile(`${args.inputDir}/${name}`);

    zip.file(name, f.toString("utf-8"));
  }

  const content = await zip.generateAsync({ type: "nodebuffer" });

  await fs.writeFile(args.outputFile, content);

  consola.success(`Wrote zip to "${args.outputFile}"`);
};
