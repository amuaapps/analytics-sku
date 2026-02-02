# @amuaapps/analytics-sku

Type-safe analytics SDK for Amua Apps with schema-driven event tracking, aligned with analytics-service ingest contract.

## ⚠️ Breaking Changes in v2.0

Version 2.0 introduces a complete redesign of the event envelope. See [MIGRATION.md](./docs/MIGRATION.md) for upgrade instructions.

## Features

- 🔒 **Type-safe event tracking** - No free-form event strings allowed
- 📋 **JSON Schema validation** - Runtime validation of event payloads with snake_case keys
- 🎯 **Domain-driven taxonomy** - Organized event catalog by business domain
- � **Privacy-minimized context** - No full URLs, no user agents, referrer host only
- 🆔 **Actor model** - Unified userId/anonymousId for session stitching
- ✅ **Consent management** - Built-in GDPR/privacy consent tracking
- 🚀 **HTTP transport with retries** - Reliable event delivery with exponential backoff
- 📦 **Subpath exports** - Import only what you need (`@amuaapps/analytics-sku/core`, `/taxonomy`)

## Installation

```bash
npm install @amuaapps/analytics-sku
```

### GitHub Packages Configuration

Add to your `.npmrc`:

```
@amuaapps:registry=https://npm.pkg.github.com
```

## Quick Start

```typescript
import { track, page, identify } from "@amuaapps/analytics-sku/core";
import { eventRegistry } from "@amuaapps/analytics-sku/taxonomy";

// Track a standard event
const trackEvent = track(
  eventRegistry["web.session_started@1"],
  { 
    utm_source: "google",
    utm_campaign: "summer_sale",
    landing_page: "/products"
  },
  {
    sessionId: "session-123",
    source: { 
      appId: "my-app",
      platform: "web",
      env: "production",
      appVersion: "1.0.0"
    },
    consent: {
      analytics: true,
      experimentation: false,
      personalization: false
    }
  }
);

// Track a page view
const pageEvent = page(
  eventRegistry["web.page_viewed@1"],
  { 
    page_path: "/products",
    page_title: "Products",
    page_category: "catalog"
  },
  {
    sessionId: "session-123",
    source: { appId: "my-app", platform: "web", env: "production" }
  }
);

// Identify a user
const identifyEvent = identify(
  { 
    email: "user@example.com",
    name: "John Doe"
  },
  {
    sessionId: "session-123",
    userId: "user-456",
    source: { appId: "my-app", platform: "web", env: "production" }
  }
);

// Send events (transport interface unchanged)
const transport = createTransport({
  ingestUrl: "https://analytics.example.com/ingest",
});

await transport.send(trackEvent);
```

## Project Structure

```
.
├── src/
│   ├── core/           # Core tracking API and transport
│   ├── taxonomy/       # Event definitions and registry
│   └── generated/      # Auto-generated types from schemas
├── schemas/            # JSON Schema definitions
│   ├── web/
│   ├── checkout/
│   └── user/
├── tests/
│   ├── unit/
│   └── integration/
├── scripts/            # Build and validation scripts
└── docs/               # Documentation
    └── TAXONOMY.md     # Event taxonomy guide
```

## Scripts

```bash
npm run build           # Build package with tsup
npm run dev             # Build in watch mode
npm run typecheck       # Type check without emitting
npm run lint            # Lint source code
npm run lint:fix        # Fix linting issues
npm run format          # Format code with Prettier
npm run format:check    # Check code formatting
npm test                # Run tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage
npm run generate:types  # Generate TS types from schemas
npm run validate:catalog # Validate event catalog
```

## Development

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Setup

```bash
git clone https://github.com/amuaapps/analytics-sku.git
cd analytics-sku
npm install
npm run build
npm test
```

## License

MIT - See [LICENSE](./LICENSE) file for details.

## Contributing

See domain ownership in [docs/TAXONOMY.md](./docs/TAXONOMY.md) for contribution guidelines.
