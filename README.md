# @amuaapps/analytics-sku

Type-safe analytics SDK for Amua Apps with schema-driven event tracking.

## Features

- 🔒 **Type-safe event tracking** - No free-form event strings allowed
- 📋 **JSON Schema validation** - Runtime validation of event payloads
- 🎯 **Domain-driven taxonomy** - Organized event catalog by business domain
- 🔄 **Automatic context injection** - URL, referrer, locale, viewport automatically captured
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
import { track, createTransport } from "@amuaapps/analytics-sku/core";
import { eventRegistry } from "@amuaapps/analytics-sku/taxonomy";

// Configure transport
const transport = createTransport({
  ingestUrl: "https://analytics.example.com/ingest",
});

// Track an event
const envelope = track(
  eventRegistry["web.page_viewed@1"],
  { page: "/home", title: "Home Page" },
  {
    sessionId: "session-123",
    source: { application: "my-app", version: "1.0.0" },
  }
);

// Send to analytics service
await transport.send(envelope);
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
