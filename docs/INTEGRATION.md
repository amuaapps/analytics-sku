# Consumer Integration Guide

This guide explains how to integrate the analytics-sku package into your microfrontend (MFE) application.

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- GitHub Personal Access Token with `read:packages` scope
- Access to `amuaapps` organization packages

## Installation

### 1. Configure npm for GitHub Packages

Create `.npmrc` in your project root:

```
@amuaapps:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

### 2. Set GitHub Token

**Local development:**

```bash
export GITHUB_TOKEN=your_github_token
```

**CI/CD:**

Add `GITHUB_TOKEN` as a secret in your CI/CD system.

### 3. Install Package

```bash
npm install @amuaapps/analytics-sku
```

## Basic Usage

### Import and Initialize

```typescript
import { track, createTransport } from "@amuaapps/analytics-sku/core";
import { eventRegistry } from "@amuaapps/analytics-sku/taxonomy";

// Create transport (do this once, typically in app initialization)
const transport = createTransport({
  ingestUrl: process.env.ANALYTICS_INGEST_URL,
  maxRetries: 3,
  queueSize: 100,
});
```

### Track Events

```typescript
// Track page view
const envelope = track(
  eventRegistry["web.page_viewed@1"],
  {
    page: window.location.pathname,
    title: document.title,
  },
  {
    sessionId: getSessionId(), // From shell
    source: {
      application: "my-mfe",
      version: "1.0.0",
      environment: process.env.NODE_ENV,
    },
  }
);

// Send to analytics service
await transport.send(envelope);
```

## Microfrontend Integration

### Shell Configuration

The shell application should provide:

1. **Session ID**: Shared across all MFEs
2. **User ID**: When user is authenticated
3. **Analytics configuration**: Ingest URL, environment

**Example shell context:**

```typescript
// shell/src/analytics-context.ts
export interface AnalyticsContext {
  sessionId: string;
  userId?: string;
  ingestUrl: string;
  environment: string;
}

export const analyticsContext: AnalyticsContext = {
  sessionId: generateSessionId(),
  userId: getCurrentUserId(),
  ingestUrl: process.env.ANALYTICS_INGEST_URL!,
  environment: process.env.NODE_ENV,
};
```

### MFE Integration

**Option 1: Props from Shell**

```typescript
// mfe/src/App.tsx
import { track, createTransport } from "@amuaapps/analytics-sku/core";
import { eventRegistry } from "@amuaapps/analytics-sku/taxonomy";

interface Props {
  analyticsContext: AnalyticsContext;
}

export function App({ analyticsContext }: Props) {
  const transport = createTransport({
    ingestUrl: analyticsContext.ingestUrl,
  });

  const trackPageView = (page: string, title: string) => {
    const envelope = track(
      eventRegistry["web.page_viewed@1"],
      { page, title },
      {
        sessionId: analyticsContext.sessionId,
        userId: analyticsContext.userId,
        source: {
          application: "my-mfe",
          version: "1.0.0",
          environment: analyticsContext.environment,
        },
      }
    );

    transport.send(envelope).catch(console.error);
  };

  // Use in your components
  useEffect(() => {
    trackPageView(location.pathname, document.title);
  }, [location.pathname]);

  return <div>...</div>;
}
```

**Option 2: Shared Context Provider**

```typescript
// shared/analytics-provider.tsx
import { createContext, useContext, ReactNode } from "react";
import { createTransport, Transport } from "@amuaapps/analytics-sku/core";

interface AnalyticsContextValue {
  transport: Transport;
  sessionId: string;
  userId?: string;
  source: {
    application: string;
    version: string;
    environment: string;
  };
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

export function AnalyticsProvider({
  children,
  config,
}: {
  children: ReactNode;
  config: AnalyticsContextValue;
}) {
  return (
    <AnalyticsContext.Provider value={config}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error("useAnalytics must be used within AnalyticsProvider");
  }
  return context;
}
```

**Usage in components:**

```typescript
import { useAnalytics } from "@shared/analytics-provider";
import { track } from "@amuaapps/analytics-sku/core";
import { eventRegistry } from "@amuaapps/analytics-sku/taxonomy";

function ProductPage() {
  const { transport, sessionId, userId, source } = useAnalytics();

  const trackProductView = (productId: string) => {
    const envelope = track(
      eventRegistry["web.page_viewed@1"],
      {
        page: `/products/${productId}`,
        title: `Product ${productId}`,
        category: "product",
      },
      { sessionId, userId, source }
    );

    transport.send(envelope).catch(console.error);
  };

  return <div>...</div>;
}
```

## React Hooks

### Custom Hook for Tracking

```typescript
// hooks/use-track-event.ts
import { useCallback } from "react";
import { track } from "@amuaapps/analytics-sku/core";
import { eventRegistry } from "@amuaapps/analytics-sku/taxonomy";
import type { EventDefinition } from "@amuaapps/analytics-sku/taxonomy";
import { useAnalytics } from "@shared/analytics-provider";

export function useTrackEvent() {
  const { transport, sessionId, userId, source } = useAnalytics();

  return useCallback(
    <T>(eventDef: EventDefinition<T>, payload: T) => {
      const envelope = track(eventDef, payload, {
        sessionId,
        userId,
        source,
      });

      return transport.send(envelope);
    },
    [transport, sessionId, userId, source]
  );
}
```

**Usage:**

```typescript
function CheckoutPage() {
  const trackEvent = useTrackEvent();

  const handlePaymentSubmit = async (paymentData) => {
    await trackEvent(eventRegistry["checkout.payment_submitted@1"], {
      orderId: paymentData.orderId,
      amount: paymentData.amount,
      currency: "USD",
      paymentMethod: "credit_card",
    });
  };

  return <div>...</div>;
}
```

## Session Management

### Generating Session ID

```typescript
// utils/session.ts
export function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getSessionId(): string {
  const key = "analytics_session_id";
  let sessionId = sessionStorage.getItem(key);

  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem(key, sessionId);
  }

  return sessionId;
}
```

### Injecting from Shell

```typescript
// shell/src/main.ts
import { getSessionId } from "./utils/session";

window.__ANALYTICS_SESSION_ID__ = getSessionId();

// MFE can access via window.__ANALYTICS_SESSION_ID__
```

## Environment Configuration

### Development

```env
ANALYTICS_INGEST_URL=http://localhost:3000/ingest
NODE_ENV=development
```

### Staging

```env
ANALYTICS_INGEST_URL=https://analytics-staging.example.com/ingest
NODE_ENV=staging
```

### Production

```env
ANALYTICS_INGEST_URL=https://analytics.example.com/ingest
NODE_ENV=production
```

## Error Handling

```typescript
const transport = createTransport({
  ingestUrl: process.env.ANALYTICS_INGEST_URL,
  onError: (error, event) => {
    console.error("Analytics error:", error);
    console.error("Failed event:", event);
    
    // Optional: Send to error tracking service
    // Sentry.captureException(error);
  },
});
```

## Testing

### Mock Transport for Tests

```typescript
// test-utils/mock-analytics.ts
import { Transport } from "@amuaapps/analytics-sku/core";

export function createMockTransport(): Transport {
  const events: any[] = [];

  return {
    send: async (event) => {
      events.push(event);
    },
    flush: async () => {
      events.length = 0;
    },
    getEvents: () => events,
  };
}
```

### Test Example

```typescript
import { render, screen } from "@testing-library/react";
import { createMockTransport } from "./test-utils/mock-analytics";

test("tracks page view on mount", () => {
  const mockTransport = createMockTransport();

  render(
    <AnalyticsProvider
      config={{
        transport: mockTransport,
        sessionId: "test-session",
        source: { application: "test", version: "1.0.0", environment: "test" },
      }}
    >
      <ProductPage />
    </AnalyticsProvider>
  );

  expect(mockTransport.getEvents()).toHaveLength(1);
  expect(mockTransport.getEvents()[0].eventName).toBe("web.page_viewed");
});
```

## Performance Considerations

### Lazy Loading

```typescript
// Load analytics SDK lazily
const loadAnalytics = async () => {
  const { track, createTransport } = await import("@amuaapps/analytics-sku/core");
  const { eventRegistry } = await import("@amuaapps/analytics-sku/taxonomy");
  
  return { track, createTransport, eventRegistry };
};
```

### Batching Events

```typescript
// Queue events and flush periodically
const eventQueue: any[] = [];

setInterval(() => {
  if (eventQueue.length > 0) {
    transport.flush();
    eventQueue.length = 0;
  }
}, 5000); // Flush every 5 seconds
```

## Troubleshooting

### Events Not Sending

1. Check `ANALYTICS_INGEST_URL` is set
2. Verify network connectivity
3. Check browser console for errors
4. Verify transport is initialized

### Type Errors

1. Ensure `@amuaapps/analytics-sku` is installed
2. Run `npm run generate:types` in the SDK repo
3. Check payload matches schema definition

### Session ID Not Persisting

1. Verify sessionStorage is available
2. Check for third-party cookie blockers
3. Ensure shell is setting session ID correctly

## Best Practices

1. **Initialize once**: Create transport at app startup
2. **Error handling**: Always catch and log errors
3. **Type safety**: Use EventDefinition types
4. **Testing**: Mock transport in tests
5. **Performance**: Consider lazy loading for large apps
6. **Privacy**: Never log PII without consent

## Related Documentation

- [Event Taxonomy](./TAXONOMY.md)
- [Publishing Guide](./PUBLISHING.md)
- [Governance](./GOVERNANCE.md)
