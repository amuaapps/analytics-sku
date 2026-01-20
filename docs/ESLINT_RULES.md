# ESLint Rules

This package includes custom ESLint rules to enforce analytics tracking best practices.

## Rules

### `analytics-sku/no-string-event-names`

**Type:** Error  
**Category:** Best Practices

Prevents calling `track()` with a string event name instead of an `EventDefinition` object from the event registry.

#### ❌ Incorrect

```typescript
import { track } from "@amuaapps/analytics-sku/core";

// Using a string event name - NOT ALLOWED
track("page_viewed", { page: "/home" });
track("checkout.payment_submitted", { orderId: "123" });
```

#### ✅ Correct

```typescript
import { track } from "@amuaapps/analytics-sku/core";
import { eventRegistry } from "@amuaapps/analytics-sku/taxonomy";

// Using EventDefinition from registry - REQUIRED
track(eventRegistry["web.page_viewed@1"], { 
  page: "/home",
  title: "Home Page"
});

track(eventRegistry["checkout.payment_submitted@1"], {
  orderId: "123",
  amount: 99.99,
  currency: "USD",
  paymentMethod: "credit_card"
});
```

## Why This Rule Exists

1. **Type Safety**: EventDefinition objects are typed, providing compile-time checks for payload structure
2. **Schema Validation**: Events are validated against JSON Schemas at runtime
3. **Versioning**: Event names include version numbers, preventing drift
4. **Discoverability**: All events are centralized in the registry
5. **Prevents Typos**: String literals are error-prone; registry access is autocomplete-friendly

## Usage in Consumer Projects

### Installation

Add this package as a dev dependency:

```bash
npm install --save-dev @amuaapps/analytics-sku
```

### ESLint Configuration

Add to your `.eslintrc.js`:

```javascript
module.exports = {
  plugins: ["@amuaapps/analytics-sku"],
  rules: {
    "@amuaapps/analytics-sku/no-string-event-names": "error",
  },
};
```

### TypeScript Configuration

Ensure your `tsconfig.json` is strict:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true
  }
}
```

## Enforcement in CI/CD

This rule is enforced in the CI pipeline. Pull requests will fail if:

- `track()` is called with a string event name
- Any ESLint violations are present

## Bypassing the Rule (Not Recommended)

If you absolutely must bypass this rule (e.g., for migration purposes):

```typescript
// eslint-disable-next-line analytics-sku/no-string-event-names
track("legacy_event", { ... });
```

**Note:** Bypasses require justification in code review and should be temporary.

## Testing

The rule is tested to ensure it catches violations:

```typescript
// This will trigger the ESLint error
const badCode = `
  track("event_name", { data: "value" });
`;

// This will pass
const goodCode = `
  track(eventRegistry["web.page_viewed@1"], { page: "/" });
`;
```

## Related Documentation

- [Event Taxonomy](./TAXONOMY.md)
- [Type Generation](./TYPE_GENERATION.md)
- [Architecture](./ARCHITECTURE.md)
