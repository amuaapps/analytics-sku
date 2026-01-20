#!/usr/bin/env node

import { readdir, readFile, writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { compile } from "json-schema-to-typescript";

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemasDir = join(__dirname, "..", "schemas");
const outputDir = join(__dirname, "..", "src", "generated");

async function findSchemaFiles(dir) {
  const files = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await findSchemaFiles(fullPath)));
    } else if (entry.name.endsWith(".schema.json")) {
      files.push(fullPath);
    }
  }

  return files;
}

async function generateTypes() {
  console.log("🔄 Generating TypeScript types from JSON Schemas...");

  await mkdir(outputDir, { recursive: true });

  const schemaFiles = await findSchemaFiles(schemasDir);
  const typeDefinitions = [];

  for (const schemaPath of schemaFiles) {
    const schemaContent = await readFile(schemaPath, "utf-8");
    const schema = JSON.parse(schemaContent);

    const relativePath = schemaPath.replace(schemasDir + "/", "");
    const schemaId = schema.$id || relativePath.replace(".schema.json", "");

    console.log(`  ✓ Processing ${schemaId}`);

    const ts = await compile(schema, schema.title || schemaId, {
      bannerComment: `/* eslint-disable */\n// Auto-generated from ${relativePath}`,
      unknownAny: false,
      strictIndexSignatures: true,
    });

    const safeName = schemaId.replace(/[\/\-@]/g, "_");
    const outputPath = join(outputDir, `${safeName}.ts`);

    await writeFile(outputPath, ts);

    typeDefinitions.push({
      schemaId,
      safeName,
      typeName: schema.title?.replace(/\s+/g, "") || safeName,
      file: `${safeName}.ts`,
    });
  }

  const indexContent = `/* eslint-disable */
// Auto-generated index file for schema types

${typeDefinitions
  .map(
    (def) =>
      `export type { ${def.typeName} } from "./${def.file.replace(".ts", ".js")}";`
  )
  .join("\n")}

export const schemaTypes = {
${typeDefinitions
  .map((def) => `  "${def.schemaId}": "${def.typeName}",`)
  .join("\n")}
} as const;
`;

  await writeFile(join(outputDir, "index.ts"), indexContent);

  console.log(`✅ Generated ${typeDefinitions.length} type definitions`);
  console.log(`📁 Output directory: ${outputDir}`);
}

generateTypes().catch((error) => {
  console.error("❌ Error generating types:", error);
  process.exit(1);
});
