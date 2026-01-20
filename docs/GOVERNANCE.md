# Governance & Domain Ownership

This document defines the governance model and domain ownership for the analytics-sku package.

## Ownership Model

### Central Maintainers (Platform Team)

**Responsibilities:**
- Core tracking API (`src/core/`)
- Event envelope specification
- Transport layer
- Build and deployment infrastructure
- Web domain schemas (`schemas/web/`)
- Schema registry index (`schemas/index.json`)
- Documentation and standards

**Approval Required For:**
- Changes to core API
- Changes to event envelope structure
- Changes to transport layer
- Changes to build/CI/CD
- Changes to web domain schemas
- Changes to schema registry index

### Domain Teams

Each business domain has an owning team responsible for their event schemas.

| Domain | Team | Schemas Path | Contact |
|--------|------|--------------|---------|
| **web** | Platform Team | `schemas/web/` | @amuaapps/platform-team |
| **checkout** | Commerce Team | `schemas/checkout/` | @amuaapps/commerce-team |
| **user** | Identity Team | `schemas/user/` | @amuaapps/identity-team |
| **product** | Catalog Team | `schemas/product/` | @amuaapps/catalog-team |

## Adding a New Event

### 1. Determine Domain Ownership

Identify which domain your event belongs to. If unsure, consult with the Platform Team.

### 2. Create Schema File

Create a new schema file in your domain directory:

```bash
schemas/<domain>/<event_name>@1.schema.json
```

**Requirements:**
- Follow JSON Schema Draft 7
- Include `$id`, `title`, `description`
- Define `required` fields
- Set `additionalProperties: false`
- Use semantic event names (snake_case)

### 3. Update Schema Registry

Add an entry to `schemas/index.json`:

```json
{
  "schemas": {
    "<domain>/<event_name>@1": {
      "file": "<domain>/<event_name>@1.schema.json",
      "domain": "<domain>",
      "eventName": "<event_name>",
      "version": 1,
      "owner": "<Team Name>"
    }
  }
}
```

### 4. Generate Types and Update Registry

```bash
npm run generate:types
```

Update `src/taxonomy/registry.ts`:

```typescript
import type { YourEventType } from "../generated/index.js";

export const eventRegistry = {
  // ... existing events
  "<domain>.<event_name>@1": {
    eventName: "<domain>.<event_name>",
    eventVersion: 1,
    schemaId: "<domain>/<event_name>@1",
    domain: "<domain>",
  } as EventDefinition<YourEventType>,
} as const;
```

### 5. Add Tests

Add validation tests in `tests/unit/validation.test.ts`:

```typescript
describe("<domain>.<event_name>@1", () => {
  it("validates correct payload", () => {
    const payload = { /* valid payload */ };
    const result = validate("<domain>/<event_name>@1", payload);
    expect(result.valid).toBe(true);
  });

  it("fails when required field is missing", () => {
    const payload = { /* missing required field */ };
    const result = validate("<domain>/<event_name>@1", payload);
    expect(result.valid).toBe(false);
  });
});
```

### 6. Create Pull Request

Use the PR template and ensure:
- [ ] All checklist items are completed
- [ ] Domain team is tagged for review
- [ ] Tests pass
- [ ] Documentation is updated

## Modifying Existing Events

### Non-Breaking Changes

**Allowed:**
- Adding optional fields
- Making required fields optional
- Relaxing validation constraints
- Adding enum values
- Improving descriptions

**Process:**
1. Modify the existing schema file
2. Regenerate types: `npm run generate:types`
3. Update tests
4. Create PR with domain team approval

### Breaking Changes

**Examples:**
- Removing fields
- Changing field types
- Making optional fields required
- Removing enum values
- Tightening validation constraints

**Process:**
1. **DO NOT** modify the existing schema
2. Create a new version: `<domain>/<event_name>@2.schema.json`
3. Add to schema registry index
4. Generate types
5. Update registry with new version
6. Document migration path
7. Create PR with:
   - Domain team approval
   - Platform team approval
   - Migration guide
   - Deprecation timeline for old version

## Pull Request Review Process

### 1. Automated Checks

All PRs must pass:
- Type checking (`npm run typecheck`)
- Linting (`npm run lint`)
- Tests (`npm test`)
- Build (`npm run build`)
- Catalog validation (`npm run validate:catalog`)

### 2. Code Review

**Required Approvals:**
- **Schema changes**: Domain team owner (via CODEOWNERS)
- **Core changes**: Platform team (2 approvals)
- **Breaking changes**: Platform team + domain team

### 3. Merge Requirements

- [ ] All automated checks pass
- [ ] Required approvals obtained
- [ ] No unresolved conversations
- [ ] Branch is up to date with `develop`

## Versioning Strategy

### Schema Versions

- **v1**: Initial release
- **v2**: Breaking changes from v1
- **v3**: Breaking changes from v2

### Package Versions

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes to core API or event envelope
- **MINOR**: New events, new optional fields
- **PATCH**: Bug fixes, documentation

## Deprecation Policy

### Event Schema Deprecation

1. **Announce**: Notify consumers 30 days before deprecation
2. **Mark**: Add deprecation notice to schema description
3. **Support**: Maintain old version for 90 days minimum
4. **Remove**: Delete schema after support period

### Timeline Example

- **Day 0**: Announce deprecation, release new version
- **Day 30**: Mark as deprecated in schema
- **Day 90**: Remove from registry (minimum)

## Dispute Resolution

If there's disagreement about:
- Domain ownership
- Schema design
- Breaking vs non-breaking changes

**Process:**
1. Discuss in PR comments
2. Escalate to domain team lead
3. Final decision: Platform team lead

## Contact

- **Platform Team**: @amuaapps/platform-team
- **Questions**: Open a GitHub Discussion
- **Issues**: Open a GitHub Issue
