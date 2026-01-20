# Architecture

## Package Design

This repository uses a **single-package with subpath exports** approach rather than a monorepo workspace.

### Rationale

**Chosen: Single Package with Subpath Exports**

```json
{
  "exports": {
    ".": "./dist/index.js",
    "./core": "./dist/core/index.js",
    "./taxonomy": "./dist/taxonomy/index.js"
  }
}
```

**Benefits:**
- Single package to publish and version
- Consumers install one dependency: `npm install @amuaapps/analytics-sku`
- Subpath exports enable tree-shaking
- Simpler CI/CD pipeline (one build, one publish)
- No workspace tooling complexity
- Easier to consume from GitHub Packages

**Alternative Considered: Multi-Package Workspace**

```
packages/
  analytics-core/
  analytics-taxonomy/
```

**Rejected because:**
- Requires workspace tooling (npm workspaces, lerna, etc.)
- Multiple packages to publish and version
- Consumers must install multiple dependencies
- More complex CI/CD (coordinate versions, publish order)
- GitHub Packages publishing complexity increases

### Module Structure

```
@amuaapps/analytics-sku
├── /core          # Core tracking API
│   ├── track()
│   ├── createTransport()
│   └── types
├── /taxonomy      # Event definitions
│   ├── EventDefinition
│   └── eventRegistry
└── /              # Main export (re-exports core + taxonomy)
```

### Usage Examples

```typescript
// Import everything
import { track, createTransport, eventRegistry } from "@amuaapps/analytics-sku";

// Import only core (tree-shakeable)
import { track, createTransport } from "@amuaapps/analytics-sku/core";

// Import only taxonomy
import { eventRegistry } from "@amuaapps/analytics-sku/taxonomy";
```

## Build System

**Tool:** tsup

**Configuration:**
- Multiple entry points for subpath exports
- ESM output format
- TypeScript declaration files (.d.ts)
- Source maps for debugging

**Output:**
```
dist/
  index.js + index.d.ts
  core/
    index.js + index.d.ts
  taxonomy/
    index.js + index.d.ts
```

## Publishing Strategy

- Single package published to GitHub Packages
- Semantic versioning (MAJOR.MINOR.PATCH)
- Automated publishing via GitHub Actions on git tags
- Pre-release versions for testing (e.g., `1.0.0-next.123`)
