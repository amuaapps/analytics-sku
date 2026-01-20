# Type Generation

This document explains how TypeScript types are automatically generated from JSON Schemas.

## Overview

We use `json-schema-to-typescript` to generate TypeScript type definitions from JSON Schema files. This ensures type safety between schema definitions and runtime code.

## Build Process

```bash
npm run generate:types
```

This script:
1. Scans `schemas/` directory for `*.schema.json` files
2. Generates TypeScript types using `json-schema-to-typescript`
3. Outputs types to `src/generated/`
4. Creates an index file exporting all types

## Generated Files

```
src/generated/
├── index.ts                              # Main export file
├── web_page_viewed_1.ts                  # Generated from web/page_viewed@1.schema.json
└── checkout_payment_submitted_1.ts       # Generated from checkout/payment_submitted@1.schema.json
```

## Usage in Code

### Import Generated Types

```typescript
import type { PageViewedEvent, PaymentSubmittedEvent } from "../generated/index.js";
```

### Use with Event Definitions

```typescript
import type { EventDefinition } from "./types.js";
import type { PageViewedEvent } from "../generated/index.js";

export const pageViewedEvent: EventDefinition<PageViewedEvent> = {
  eventName: "web.page_viewed",
  eventVersion: 1,
  schemaId: "web/page_viewed@1",
  domain: "web",
};
```

### Type-Safe Tracking

```typescript
import { track } from "@amuaapps/analytics-sku/core";
import { eventRegistry } from "@amuaapps/analytics-sku/taxonomy";

// TypeScript enforces the correct payload shape
const envelope = track(
  eventRegistry["web.page_viewed@1"],
  {
    page: "/home",      // ✅ Required
    title: "Home Page", // ✅ Required
    category: "landing" // ✅ Optional
    // invalid: "field" // ❌ TypeScript error
  }
);
```

## Integration with Build

The type generation is integrated into the build process:

1. **Development**: Run `npm run generate:types` when schemas change
2. **CI/CD**: Types are generated automatically before build
3. **Pre-publish**: `prepublishOnly` script ensures types are current

## Schema to Type Mapping

| Schema ID | Generated Type | File |
|-----------|---------------|------|
| `web/page_viewed@1` | `PageViewedEvent` | `web_page_viewed_1.ts` |
| `checkout/payment_submitted@1` | `PaymentSubmittedEvent` | `checkout_payment_submitted_1.ts` |

## Naming Convention

Schema files use the pattern:
```
<domain>/<event_name>@<version>.schema.json
```

Generated type files use:
```
<domain>_<event_name>_<version>.ts
```

Type names are derived from the schema `title` field:
```json
{
  "title": "Page Viewed Event"  // → PageViewedEvent
}
```

## Troubleshooting

### Types out of sync with schemas

```bash
npm run generate:types
npm run typecheck
```

### Missing type exports

Check that the schema has a valid `title` field and `$id` field.

### Build errors after schema changes

1. Regenerate types: `npm run generate:types`
2. Update registry: Add new event to `src/taxonomy/registry.ts`
3. Rebuild: `npm run build`
