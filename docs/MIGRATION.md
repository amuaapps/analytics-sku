# Migration Guide: v1.x to v2.0

This document outlines the breaking changes introduced in v2.0 and provides migration instructions.

## Overview

Version 2.0 introduces a complete redesign of the event envelope to align with the analytics-service ingest contract. This is a **breaking change** that requires code updates.

## Breaking Changes

### 1. Event Envelope Structure

**Old Format (v1.x):**
```typescript
{
  specVersion: "1.0.0",
  eventName: "web.page_viewed",
  eventVersion: 1,
  schemaId: "web/page_viewed@1",
  timestamp: "2026-01-01T00:00:00.000Z",
  source: { application: "my-app", version: "1.0.0", environment: "prod" },
  correlation: { sessionId: "session-123", userId: "user-456" },
  context: { url: "https://example.com/page", locale: "en-US" },
  payload: { page: "/home", title: "Home" }
}
```

**New Format (v2.0):**
```typescript
{
  schemaVersion: "1.0.0",
  eventId: "uuid-v4",
  type: "track" | "page" | "identify",
  name: "web.page_viewed",
  occurredAt: "2026-01-01T00:00:00.000Z",
  source: { appId: "my-app", platform: "web", env: "prod", appVersion: "1.0.0" },
  actor: { userId: "user-456", anonymousId: "session-123" },
  context: { sessionId: "session-123", locale: "en-US", page: { path: "/home" } },
  consent: { analytics: true, experimentation: false, personalization: false, timestamp: "..." },
  properties: { page_path: "/home", page_title: "Home" }
}
```

### 2. Property Keys Must Be snake_case

**Old:** `{ page: "/home", title: "Home" }`  
**New:** `{ page_path: "/home", page_title: "Home" }`

All property keys must use lowercase snake_case. CamelCase is no longer allowed.

### 3. Privacy-Minimized Context Collection

**What Changed:**
- ❌ **Removed:** Full URL collection (`context.url`)
- ❌ **Removed:** User agent collection (`context.userAgent`)
- ✅ **Changed:** Referrer now stores **host only** (e.g., `google.com` instead of full URL)
- ✅ **Added:** `context.page.path` (pathname only, no query string)
- ✅ **Added:** `context.timezone` (IANA timezone)
- ✅ **Added:** `context.device.device_class` (mobile/tablet/desktop)

### 4. Required Fields

**sessionId is now required:**
```typescript
// ❌ Old - sessionId was optional
track(eventDef, payload, {
  source: { application: "my-app" }
});

// ✅ New - sessionId is required
track(eventDef, properties, {
  sessionId: "session-123",
  source: { appId: "my-app", platform: "web", env: "prod" }
});
```

### 5. Event Definition Structure

**Old:**
```typescript
{
  eventName: "web.page_viewed",
  eventVersion: 1,
  schemaId: "web/page_viewed@1",
  domain: "web"
}
```

**New:**
```typescript
{
  name: "web.page_viewed",
  type: "page",
  domain: "web"
}
```

### 6. New Event Types

Three event types are now supported:
- `track` - Standard tracking events
- `page` - Page view events
- `identify` - User identification events

### 7. Actor Model

**Old:** `correlation: { userId, sessionId }`  
**New:** `actor: { userId, anonymousId }`

- `actor.userId` - Authenticated user ID (optional)
- `actor.anonymousId` - Anonymous identifier (defaults to sessionId)
- At least one must be present

### 8. Consent Management

New consent object for GDPR/privacy compliance:
```typescript
consent: {
  analytics: true,
  experimentation: false,
  personalization: false,
  timestamp: "2026-01-01T00:00:00.000Z"
}
```

## Migration Steps

### Step 1: Update Event Tracking Calls

**Before:**
```typescript
import { track } from "@amuaapps/analytics-sku/core";
import { eventRegistry } from "@amuaapps/analytics-sku/taxonomy";

const envelope = track(
  eventRegistry["web.page_viewed@1"],
  { page: "/home", title: "Home Page" },
  {
    sessionId: "session-123",
    source: { application: "my-app" }
  }
);
```

**After:**
```typescript
import { track } from "@amuaapps/analytics-sku/core";
import { eventRegistry } from "@amuaapps/analytics-sku/taxonomy";

const event = track(
  eventRegistry["web.page_viewed@1"],
  { page_path: "/home", page_title: "Home Page" }, // snake_case keys
  {
    sessionId: "session-123", // Required
    source: { 
      appId: "my-app",      // Changed from 'application'
      platform: "web",       // Required
      env: "production"      // Changed from 'environment'
    }
  }
);
```

### Step 2: Update Property Keys to snake_case

Convert all property keys from camelCase to snake_case:

```typescript
// ❌ Before
{ 
  orderId: "123",
  paymentMethod: "credit_card",
  totalAmount: 99.99
}

// ✅ After
{
  order_id: "123",
  payment_method: "credit_card",
  total_amount: 99.99
}
```

### Step 3: Add Consent (Optional but Recommended)

```typescript
track(eventDef, properties, {
  sessionId: "session-123",
  source: { appId: "my-app", platform: "web", env: "prod" },
  consent: {
    analytics: true,
    experimentation: false,
    personalization: false
  }
});
```

### Step 4: Use New Event Functions

**Page Events:**
```typescript
import { page } from "@amuaapps/analytics-sku/core";

const event = page(
  eventRegistry["web.page_viewed@1"],
  { page_path: "/products" },
  { sessionId: "session-123", source: { appId: "my-app", platform: "web", env: "prod" } }
);
```

**Identify Events:**
```typescript
import { identify } from "@amuaapps/analytics-sku/core";

const event = identify(
  { email: "user@example.com", name: "John Doe" },
  { 
    sessionId: "session-123",
    userId: "user-456",
    source: { appId: "my-app", platform: "web", env: "prod" }
  }
);
```

### Step 5: Update Transport Usage

The transport interface remains the same, but now sends `IngestEvent` objects:

```typescript
import { createTransport } from "@amuaapps/analytics-sku/core";

const transport = createTransport({
  ingestUrl: "https://analytics.example.com/ingest"
});

// Send single event
await transport.send(event);

// Batch sending (create IngestRequestEnvelope manually)
const batch = {
  schemaVersion: "1.0.0",
  sentAt: new Date().toISOString(),
  events: [event1, event2, event3]
};
```

## New Events Available

Three new events have been added to the registry:

1. **`web.session_started@1`** - Track session start with attribution
   ```typescript
   track(eventRegistry["web.session_started@1"], {
     utm_source: "google",
     utm_campaign: "summer_sale",
     referrer_host: "google.com",
     landing_page: "/products"
   }, options);
   ```

2. **`web.experiment_exposed@1`** - Track A/B test exposure
   ```typescript
   track(eventRegistry["web.experiment_exposed@1"], {
     experiment_id: "exp_123",
     experiment_name: "Checkout Flow V2",
     variant_id: "variant_a",
     variant_name: "New Flow"
   }, options);
   ```

3. **`checkout.purchase_completed@1`** - Track completed purchases
   ```typescript
   track(eventRegistry["checkout.purchase_completed@1"], {
     order_id: "order_789",
     total_amount: 149.99,
     currency: "USD",
     payment_method: "credit_card",
     items: [...]
   }, options);
   ```

## Validation Changes

- Schemas now allow `additionalProperties: true` for flexibility
- Most fields are optional to support incremental adoption
- Type validation is still enforced (strings must be strings, etc.)

## Testing Your Migration

1. Update your code following the steps above
2. Run your test suite
3. Verify events are properly formatted:
   ```typescript
   expect(event.schemaVersion).toBe("1.0.0");
   expect(event.eventId).toBeDefined();
   expect(event.type).toBe("track");
   expect(event.name).toBe("web.page_viewed");
   expect(event.occurredAt).toBeDefined();
   expect(event.source.appId).toBeDefined();
   expect(event.actor.userId || event.actor.anonymousId).toBeDefined();
   ```

## Need Help?

- Review the updated [TAXONOMY.md](./TAXONOMY.md) for the complete event catalog
- Check [INTEGRATION.md](./INTEGRATION.md) for integration examples
- See test files in `tests/unit/` for working examples

## Rollback

If you need to rollback to v1.x:

```bash
npm install @amuaapps/analytics-sku@1.x
```

Note: v1.x will not be compatible with the new analytics-service ingest endpoint.
