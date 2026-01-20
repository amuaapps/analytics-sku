# Schema Registry

This directory contains JSON Schema definitions for all analytics events.

## Directory Structure

```
schemas/
├── index.json                    # Schema registry index
├── web/                          # Web domain events
│   └── page_viewed@1.schema.json
├── checkout/                     # Checkout domain events
│   └── payment_submitted@1.schema.json
├── user/                         # User domain events
└── product/                      # Product domain events
```

## Naming Convention

Schema files MUST follow this naming pattern:

```
<domain>/<event_name>@<version>.schema.json
```

**Examples:**
- `web/page_viewed@1.schema.json`
- `checkout/payment_submitted@1.schema.json`
- `user/account_created@2.schema.json`

## Schema ID

The `$id` field in each schema MUST match the file path (without `.schema.json`):

```json
{
  "$id": "web/page_viewed@1",
  ...
}
```

## Adding a New Event

1. **Create schema file** in the appropriate domain directory
2. **Add entry** to `schemas/index.json`
3. **Run validation**: `npm run validate:catalog`
4. **Generate types**: `npm run generate:types`
5. **Update registry**: Add event to `src/taxonomy/registry.ts`

## Schema Requirements

All schemas MUST:
- Use JSON Schema Draft 7
- Include `$schema` and `$id` fields
- Include `title` and `description`
- Define `type: "object"`
- List `required` fields
- Set `additionalProperties: false` (strict validation)

## Versioning

When making changes to an event:

- **Non-breaking changes** (add optional field): Keep same version
- **Breaking changes** (remove field, change type): Create new version

**Example:**
```
web/page_viewed@1.schema.json  (original)
web/page_viewed@2.schema.json  (breaking change)
```

## Domain Ownership

| Domain | Owner | Approval Required |
|--------|-------|-------------------|
| web | Platform Team | Platform Team lead |
| checkout | Commerce Team | Commerce Team lead |
| user | Identity Team | Identity Team lead |
| product | Catalog Team | Catalog Team lead |

See [CODEOWNERS](../.github/CODEOWNERS) for PR approval rules.
