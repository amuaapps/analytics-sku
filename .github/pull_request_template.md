# Pull Request

## Description

<!-- Provide a brief description of the changes in this PR -->

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] New event schema
- [ ] Schema version update

## Event Schema Changes

<!-- If this PR adds or modifies event schemas, fill out this section -->

### New Events

- [ ] Event: `<domain>/<event_name>@<version>`
  - Domain: 
  - Owner team: 
  - Schema file: 
  - Generated types: 

### Modified Events

- [ ] Event: `<domain>/<event_name>@<version>`
  - Change type: [ ] Non-breaking [ ] Breaking
  - Reason for change: 
  - Migration path (if breaking): 

## Checklist

### General

- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes

### Schema Changes (if applicable)

- [ ] Schema file follows naming convention: `<domain>/<event_name>@<version>.schema.json`
- [ ] Schema has valid `$id` field matching file path
- [ ] Schema includes `title` and `description` fields
- [ ] Schema defines `required` fields
- [ ] Schema sets `additionalProperties: false`
- [ ] Added entry to `schemas/index.json`
- [ ] Ran `npm run generate:types` to generate TypeScript types
- [ ] Updated `src/taxonomy/registry.ts` with new event definition
- [ ] Ran `npm run validate:catalog` successfully
- [ ] Added validation tests in `tests/unit/validation.test.ts`
- [ ] Domain team has approved (see CODEOWNERS)

### Breaking Changes (if applicable)

- [ ] Documented breaking changes in PR description
- [ ] Created new schema version (e.g., `@2` instead of modifying `@1`)
- [ ] Updated migration guide
- [ ] Notified consumers via appropriate channels

## Testing

<!-- Describe the tests you ran to verify your changes -->

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Domain Ownership

<!-- Tag the appropriate domain team for review -->

- [ ] @amuaapps/platform-team (web domain, core infrastructure)
- [ ] @amuaapps/commerce-team (checkout domain)
- [ ] @amuaapps/identity-team (user domain)
- [ ] @amuaapps/catalog-team (product domain)

## Additional Notes

<!-- Any additional information that reviewers should know -->
