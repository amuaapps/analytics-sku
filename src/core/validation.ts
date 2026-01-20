import Ajv, { type ValidateFunction } from "ajv";
import addFormats from "ajv-formats";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemasDir = join(__dirname, "..", "..", "schemas");

const ajv = new Ajv({
  allErrors: true,
  strict: true,
  validateFormats: true,
});

addFormats(ajv);

const schemaCache = new Map<string, ValidateFunction>();

function loadSchema(schemaId: string): ValidateFunction {
  if (schemaCache.has(schemaId)) {
    return schemaCache.get(schemaId)!;
  }

  const schemaPath = join(schemasDir, `${schemaId}.schema.json`);
  
  try {
    const schemaContent = readFileSync(schemaPath, "utf-8");
    const schema = JSON.parse(schemaContent) as Record<string, unknown>;
    const validate = ajv.compile(schema);
    schemaCache.set(schemaId, validate);
    return validate;
  } catch (error) {
    throw new Error(
      `Failed to load schema ${schemaId}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export interface ValidationResult {
  valid: boolean;
  errors?: Array<{
    path: string;
    message: string;
    keyword?: string;
  }>;
}

export function validate(schemaId: string, payload: unknown): ValidationResult {
  try {
    const validateFn = loadSchema(schemaId);
    const valid = validateFn(payload);

    if (!valid && validateFn.errors) {
      return {
        valid: false,
        errors: validateFn.errors.map((err) => ({
          path: err.instancePath || "/",
          message: err.message || "Validation failed",
          keyword: err.keyword,
        })),
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      errors: [
        {
          path: "/",
          message: error instanceof Error ? error.message : String(error),
        },
      ],
    };
  }
}

export function validateOrThrow(schemaId: string, payload: unknown): void {
  const result = validate(schemaId, payload);
  if (!result.valid) {
    const errorMessages = result.errors
      ?.map((err) => `${err.path}: ${err.message}`)
      .join(", ");
    throw new Error(`Validation failed for ${schemaId}: ${errorMessages}`);
  }
}
