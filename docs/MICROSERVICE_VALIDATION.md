# Microservice Ingestion Validation

This document explains how to implement validation in the analytics ingestion microservice.

## Overview

The ingestion microservice should remain **generic** and **schema-agnostic**. It validates:

1. **Envelope structure**: Required fields, types, size limits
2. **Payload validation**: By looking up the schema using `schemaId`
3. **Authentication**: API key or token validation
4. **Rate limiting**: Prevent abuse

## Architecture

```
┌─────────────┐
│   Client    │
│   (MFE)     │
└──────┬──────┘
       │ POST /ingest
       │ { envelope }
       ▼
┌─────────────────────┐
│  Ingestion Service  │
│                     │
│  1. Auth check      │
│  2. Envelope valid  │
│  3. Schema lookup   │
│  4. Payload valid   │
│  5. Store event     │
└─────────────────────┘
       │
       ▼
┌─────────────┐
│  Event      │
│  Store      │
└─────────────┘
```

## Implementation (Node.js + TypeScript)

### 1. Project Structure

```
src/
├── app/
│   └── ingest-handler.ts      # HTTP handler
├── domain/
│   ├── envelope-validator.ts  # Envelope validation
│   └── schema-validator.ts    # Payload validation
├── infra/
│   ├── schema-loader.ts       # Load schemas from registry
│   └── event-store.ts         # Persist events
└── config/
    └── index.ts               # Configuration
```

### 2. Envelope Validation

```typescript
// src/domain/envelope-validator.ts
import { z } from "zod";

const EnvelopeSchema = z.object({
  specVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
  eventName: z.string().min(1),
  eventVersion: z.number().int().positive(),
  schemaId: z.string().regex(/^[\w-]+\/[\w-]+@\d+$/),
  timestamp: z.string().datetime(),
  source: z.object({
    application: z.string().min(1),
    version: z.string().optional(),
    environment: z.string().optional(),
  }),
  correlation: z.object({
    sessionId: z.string().optional(),
    userId: z.string().optional(),
    requestId: z.string().optional(),
  }),
  context: z.object({
    url: z.string().url().optional(),
    path: z.string().optional(),
    referrer: z.string().optional(),
    locale: z.string().optional(),
    userAgent: z.string().optional(),
    viewport: z
      .object({
        width: z.number().positive(),
        height: z.number().positive(),
      })
      .optional(),
  }),
  payload: z.record(z.unknown()),
});

export type EventEnvelope = z.infer<typeof EnvelopeSchema>;

export function validateEnvelope(data: unknown): {
  valid: boolean;
  envelope?: EventEnvelope;
  errors?: string[];
} {
  const result = EnvelopeSchema.safeParse(data);

  if (!result.success) {
    return {
      valid: false,
      errors: result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
    };
  }

  return {
    valid: true,
    envelope: result.data,
  };
}
```

### 3. Schema Validation

```typescript
// src/domain/schema-validator.ts
import Ajv, { ValidateFunction } from "ajv";
import addFormats from "ajv-formats";

const ajv = new Ajv({
  allErrors: true,
  strict: true,
  validateFormats: true,
});

addFormats(ajv);

const schemaCache = new Map<string, ValidateFunction>();

export interface ValidationResult {
  valid: boolean;
  errors?: Array<{
    path: string;
    message: string;
  }>;
}

export function validatePayload(
  schemaId: string,
  payload: unknown,
  schema: Record<string, unknown>
): ValidationResult {
  let validateFn = schemaCache.get(schemaId);

  if (!validateFn) {
    validateFn = ajv.compile(schema);
    schemaCache.set(schemaId, validateFn);
  }

  const valid = validateFn(payload);

  if (!valid && validateFn.errors) {
    return {
      valid: false,
      errors: validateFn.errors.map((err) => ({
        path: err.instancePath || "/",
        message: err.message || "Validation failed",
      })),
    };
  }

  return { valid: true };
}
```

### 4. Schema Loader

```typescript
// src/infra/schema-loader.ts
import { readFile } from "fs/promises";
import { join } from "path";

interface SchemaRegistry {
  schemas: Record<
    string,
    {
      file: string;
      domain: string;
      eventName: string;
      version: number;
      owner: string;
    }
  >;
}

export class SchemaLoader {
  private schemasDir: string;
  private registry: SchemaRegistry | null = null;

  constructor(schemasDir: string) {
    this.schemasDir = schemasDir;
  }

  async loadRegistry(): Promise<void> {
    const indexPath = join(this.schemasDir, "index.json");
    const content = await readFile(indexPath, "utf-8");
    this.registry = JSON.parse(content) as SchemaRegistry;
  }

  async getSchema(schemaId: string): Promise<Record<string, unknown> | null> {
    if (!this.registry) {
      await this.loadRegistry();
    }

    const entry = this.registry!.schemas[schemaId];
    if (!entry) {
      return null;
    }

    const schemaPath = join(this.schemasDir, entry.file);
    const content = await readFile(schemaPath, "utf-8");
    return JSON.parse(content) as Record<string, unknown>;
  }
}
```

### 5. Ingestion Handler

```typescript
// src/app/ingest-handler.ts
import { Request, Response } from "express";
import { validateEnvelope } from "../domain/envelope-validator.js";
import { validatePayload } from "../domain/schema-validator.js";
import { SchemaLoader } from "../infra/schema-loader.js";
import { EventStore } from "../infra/event-store.js";

const schemaLoader = new SchemaLoader(process.env.SCHEMAS_DIR || "./schemas");
const eventStore = new EventStore();

export async function ingestHandler(req: Request, res: Response) {
  // 1. Validate envelope structure
  const envelopeResult = validateEnvelope(req.body);
  if (!envelopeResult.valid) {
    return res.status(400).json({
      error: "Invalid envelope",
      details: envelopeResult.errors,
    });
  }

  const envelope = envelopeResult.envelope!;

  // 2. Size limit check
  const bodySize = JSON.stringify(req.body).length;
  if (bodySize > 100_000) {
    // 100KB limit
    return res.status(413).json({
      error: "Payload too large",
      maxSize: 100_000,
      actualSize: bodySize,
    });
  }

  // 3. Load schema by schemaId
  const schema = await schemaLoader.getSchema(envelope.schemaId);
  if (!schema) {
    return res.status(400).json({
      error: "Unknown schema",
      schemaId: envelope.schemaId,
    });
  }

  // 4. Validate payload against schema
  const payloadResult = validatePayload(
    envelope.schemaId,
    envelope.payload,
    schema
  );

  if (!payloadResult.valid) {
    return res.status(400).json({
      error: "Invalid payload",
      schemaId: envelope.schemaId,
      details: payloadResult.errors,
    });
  }

  // 5. Store event
  try {
    await eventStore.store(envelope);
    
    return res.status(202).json({
      status: "accepted",
      eventId: envelope.correlation.requestId,
    });
  } catch (error) {
    console.error("Failed to store event:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
}
```

### 6. Authentication Middleware

```typescript
// src/app/auth-middleware.ts
import { Request, Response, NextFunction } from "express";

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    return res.status(401).json({
      error: "Missing API key",
    });
  }

  // Validate API key (check against database or secret store)
  if (apiKey !== process.env.ANALYTICS_API_KEY) {
    return res.status(403).json({
      error: "Invalid API key",
    });
  }

  next();
}
```

### 7. Rate Limiting

```typescript
// src/app/rate-limit-middleware.ts
import rateLimit from "express-rate-limit";

export const rateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000, // 1000 requests per minute per IP
  message: {
    error: "Too many requests",
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});
```

### 8. Express App

```typescript
// src/app/index.ts
import express from "express";
import { ingestHandler } from "./ingest-handler.js";
import { authMiddleware } from "./auth-middleware.js";
import { rateLimiter } from "./rate-limit-middleware.js";

const app = express();

app.use(express.json({ limit: "100kb" }));
app.use(rateLimiter);

app.post("/ingest", authMiddleware, ingestHandler);

app.get("/health", (req, res) => {
  res.json({ status: "healthy" });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Analytics ingestion service listening on port ${port}`);
});
```

## Validation Flow

```
1. Request arrives
   ↓
2. Rate limit check
   ↓
3. Authentication check
   ↓
4. Parse JSON body
   ↓
5. Validate envelope structure
   ↓
6. Check payload size
   ↓
7. Lookup schema by schemaId
   ↓
8. Validate payload against schema
   ↓
9. Store event
   ↓
10. Return 202 Accepted
```

## Error Responses

### 400 Bad Request - Invalid Envelope

```json
{
  "error": "Invalid envelope",
  "details": [
    "timestamp: Invalid datetime format",
    "source.application: Required"
  ]
}
```

### 400 Bad Request - Invalid Payload

```json
{
  "error": "Invalid payload",
  "schemaId": "web/page_viewed@1",
  "details": [
    {
      "path": "/page",
      "message": "must be string"
    },
    {
      "path": "",
      "message": "must have required property 'title'"
    }
  ]
}
```

### 400 Bad Request - Unknown Schema

```json
{
  "error": "Unknown schema",
  "schemaId": "unknown/event@1"
}
```

### 413 Payload Too Large

```json
{
  "error": "Payload too large",
  "maxSize": 100000,
  "actualSize": 150000
}
```

## Testing

### Unit Tests

```typescript
// tests/envelope-validator.test.ts
import { validateEnvelope } from "../src/domain/envelope-validator";

describe("validateEnvelope", () => {
  it("validates correct envelope", () => {
    const envelope = {
      specVersion: "1.0.0",
      eventName: "web.page_viewed",
      eventVersion: 1,
      schemaId: "web/page_viewed@1",
      timestamp: new Date().toISOString(),
      source: { application: "test-app" },
      correlation: {},
      context: {},
      payload: { page: "/home", title: "Home" },
    };

    const result = validateEnvelope(envelope);
    expect(result.valid).toBe(true);
  });

  it("fails for invalid timestamp", () => {
    const envelope = {
      /* ... */
      timestamp: "invalid",
      /* ... */
    };

    const result = validateEnvelope(envelope);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("timestamp: Invalid datetime");
  });
});
```

### Integration Tests

```typescript
// tests/ingest.integration.test.ts
import request from "supertest";
import { app } from "../src/app";

describe("POST /ingest", () => {
  it("accepts valid event", async () => {
    const response = await request(app)
      .post("/ingest")
      .set("x-api-key", process.env.ANALYTICS_API_KEY!)
      .send({
        specVersion: "1.0.0",
        eventName: "web.page_viewed",
        eventVersion: 1,
        schemaId: "web/page_viewed@1",
        timestamp: new Date().toISOString(),
        source: { application: "test" },
        correlation: {},
        context: {},
        payload: { page: "/test", title: "Test" },
      });

    expect(response.status).toBe(202);
    expect(response.body.status).toBe("accepted");
  });

  it("rejects invalid payload", async () => {
    const response = await request(app)
      .post("/ingest")
      .set("x-api-key", process.env.ANALYTICS_API_KEY!)
      .send({
        /* valid envelope */
        payload: { page: 123 }, // Invalid: should be string
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid payload");
  });
});
```

## Deployment Considerations

1. **Schema Distribution**: Deploy schemas alongside the service or load from CDN
2. **Caching**: Cache compiled schemas in memory
3. **Monitoring**: Track validation failures, latency, throughput
4. **Scaling**: Horizontal scaling for high throughput
5. **Logging**: Log all validation failures for debugging

## Related Documentation

- [Event Taxonomy](./TAXONOMY.md)
- [Schema Registry](../schemas/README.md)
- [Integration Guide](./INTEGRATION.md)
