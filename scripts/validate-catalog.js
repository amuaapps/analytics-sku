#!/usr/bin/env node

import { readdir, readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemasDir = join(__dirname, "..", "schemas");
const indexPath = join(schemasDir, "index.json");

const ALLOWED_DOMAINS = ["web", "checkout", "user", "product"];

async function findSchemaFiles(dir, domain = null) {
  const files = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== "node_modules") {
      files.push(...(await findSchemaFiles(fullPath, entry.name)));
    } else if (entry.name.endsWith(".schema.json")) {
      files.push({ path: fullPath, domain, filename: entry.name });
    }
  }

  return files;
}

async function validateCatalog() {
  console.log("🔍 Validating event catalog...\n");

  let hasErrors = false;

  const indexContent = await readFile(indexPath, "utf-8");
  const index = JSON.parse(indexContent);

  const schemaFiles = await findSchemaFiles(schemasDir);
  const registeredSchemas = new Set(Object.keys(index.schemas || {}));

  for (const { path, domain, filename } of schemaFiles) {
    const schemaContent = await readFile(path, "utf-8");
    const schema = JSON.parse(schemaContent);

    const expectedPattern = /^(.+)@(\d+)\.schema\.json$/;
    const match = filename.match(expectedPattern);

    if (!match) {
      console.error(`❌ Invalid filename: ${filename}`);
      console.error(`   Expected pattern: <event_name>@<version>.schema.json`);
      hasErrors = true;
      continue;
    }

    const [, eventName, version] = match;
    const expectedSchemaId = `${domain}/${eventName}@${version}`;

    if (schema.$id !== expectedSchemaId) {
      console.error(`❌ Schema ID mismatch in ${filename}`);
      console.error(`   Expected: ${expectedSchemaId}`);
      console.error(`   Found: ${schema.$id}`);
      hasErrors = true;
    }

    if (!ALLOWED_DOMAINS.includes(domain)) {
      console.error(`❌ Invalid domain: ${domain}`);
      console.error(`   Allowed domains: ${ALLOWED_DOMAINS.join(", ")}`);
      hasErrors = true;
    }

    if (!registeredSchemas.has(expectedSchemaId)) {
      console.error(`❌ Schema not registered in index.json: ${expectedSchemaId}`);
      hasErrors = true;
    }

    if (!schema.title || !schema.description) {
      console.error(`❌ Missing title or description in ${filename}`);
      hasErrors = true;
    }

    if (schema.additionalProperties !== false) {
      console.error(`❌ Schema must set additionalProperties: false in ${filename}`);
      hasErrors = true;
    }

    console.log(`✓ ${expectedSchemaId}`);
  }

  for (const schemaId of registeredSchemas) {
    const entry = index.schemas[schemaId];
    const expectedPath = join(schemasDir, entry.file);
    
    try {
      await readFile(expectedPath, "utf-8");
    } catch {
      console.error(`❌ Registered schema file not found: ${entry.file}`);
      hasErrors = true;
    }
  }

  console.log(`\n${hasErrors ? "❌" : "✅"} Validation ${hasErrors ? "failed" : "passed"}`);

  if (hasErrors) {
    process.exit(1);
  }
}

validateCatalog().catch((error) => {
  console.error("❌ Error validating catalog:", error);
  process.exit(1);
});
