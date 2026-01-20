# Release Process

This document describes the release process for the analytics-sku package.

## Release Strategy

We use **manual versioning** with automated publishing via GitHub Actions.

### Why Manual Versioning?

- **Human decision required**: Version bumps communicate intent to consumers
- **Breaking change awareness**: Humans understand impact better than automation
- **Semantic versioning compliance**: MAJOR.MINOR.PATCH decisions need context
- **Consumer stability**: Incorrect versions can break consumer CI/CD pipelines

## Versioning

Follow [Semantic Versioning 2.0.0](https://semver.org/):

- **MAJOR** (`X.0.0`): Breaking changes
  - Removing event schemas
  - Changing event envelope structure
  - Removing exports from core API
  - Changing function signatures
  
- **MINOR** (`0.X.0`): New features (backward-compatible)
  - Adding new event schemas
  - Adding optional fields to existing schemas
  - Adding new exports to core API
  - Adding new optional parameters
  
- **PATCH** (`0.0.X`): Bug fixes
  - Fixing validation logic
  - Improving error messages
  - Documentation updates
  - Dependency updates (non-breaking)

## Release Process

### 1. Prepare Release

Ensure you're on the `develop` branch with all changes merged:

```bash
git checkout develop
git pull origin develop
```

### 2. Run Pre-release Checks

```bash
npm run typecheck
npm run lint
npm run format:check
npm test
npm run generate:types
npm run validate:catalog
npm run build
```

All checks must pass before proceeding.

### 3. Decide Version Bump

Determine the appropriate version based on changes since last release:

```bash
# View changes since last tag
git log $(git describe --tags --abbrev=0)..HEAD --oneline

# View current version
npm version
```

**Decision matrix:**
- Breaking changes? → MAJOR
- New features only? → MINOR
- Bug fixes only? → PATCH

### 4. Update Version

```bash
# For MAJOR version (breaking changes)
npm version major

# For MINOR version (new features)
npm version minor

# For PATCH version (bug fixes)
npm version patch
```

This will:
- Update `package.json` version
- Create a git commit
- Create a git tag (e.g., `v1.2.3`)

### 5. Push to GitHub

```bash
# Push the version commit
git push origin develop

# Push the tag (this triggers publishing)
git push origin --tags
```

### 6. Monitor GitHub Actions

1. Go to https://github.com/amuaapps/analytics-sku/actions
2. Watch the "Publish to GitHub Packages" workflow
3. Verify all steps complete successfully

### 7. Verify Publication

```bash
# Check package is published
npm view @amuaapps/analytics-sku version

# Verify it matches your release
npm view @amuaapps/analytics-sku versions
```

### 8. Create Release Notes

1. Go to https://github.com/amuaapps/analytics-sku/releases
2. Find the auto-created release
3. Edit and add release notes:

```markdown
## What's Changed

### New Features
- Add new event schema: `user/account_created@1`
- Support for custom context fields

### Bug Fixes
- Fix validation error messages
- Correct TypeScript types for optional fields

### Breaking Changes
- Removed deprecated `track()` overload
- Changed envelope `specVersion` to `2.0.0`

### Migration Guide
[If breaking changes exist, provide migration steps]

## Full Changelog
https://github.com/amuaapps/analytics-sku/compare/v1.0.0...v1.1.0
```

### 9. Announce Release

Notify consumers via appropriate channels:
- Internal Slack/Teams
- Email to stakeholders
- Update documentation

## Pre-release Versions

For testing before promoting to `latest`:

### Create Pre-release

```bash
# Beta release
npm version prerelease --preid=beta
# Results in: 1.2.0-beta.0

# Release candidate
npm version prerelease --preid=rc
# Results in: 1.2.0-rc.0
```

### Publish Pre-release

```bash
git push origin develop --tags
```

Pre-releases are automatically published but **not** tagged as `latest`.

### Install Pre-release

```bash
npm install @amuaapps/analytics-sku@beta
npm install @amuaapps/analytics-sku@1.2.0-beta.0
```

### Promote to Latest

Once validated:

```bash
npm version patch  # or minor/major
git push origin develop --tags
```

## Hotfix Process

For critical bugs in production:

### 1. Create Hotfix Branch

```bash
git checkout main
git checkout -b hotfix/critical-bug
```

### 2. Fix and Test

```bash
# Make fixes
npm test
npm run build
```

### 3. Version and Release

```bash
npm version patch
git push origin hotfix/critical-bug --tags
```

### 4. Merge Back

```bash
# Create PR to main
# After merge, also merge to develop
git checkout develop
git merge main
git push origin develop
```

## Rollback Process

If a release has critical issues:

### 1. Deprecate Bad Version

```bash
npm deprecate @amuaapps/analytics-sku@1.2.3 "Critical bug, use 1.2.2 instead"
```

### 2. Publish Fixed Version

Follow standard release process with patch version.

### 3. Notify Consumers

Immediately notify all consumers to:
- Pin to last known good version
- Upgrade to fixed version when available

## Changelog Maintenance

Maintain `CHANGELOG.md` following [Keep a Changelog](https://keepachangelog.com/):

```markdown
# Changelog

## [1.2.0] - 2026-01-20

### Added
- New event schema: `user/account_created@1`
- Support for custom context fields

### Changed
- Improved validation error messages

### Deprecated
- Old `track()` overload (use EventDefinition instead)

### Removed
- None

### Fixed
- TypeScript types for optional fields

### Security
- Updated dependencies with security patches
```

## Version Support Policy

- **Latest MAJOR**: Full support
- **Previous MAJOR**: Security fixes only (6 months)
- **Older versions**: No support

## Checklist

Before releasing:

- [ ] All tests pass
- [ ] Linting passes
- [ ] Types generated from schemas
- [ ] Catalog validation passes
- [ ] Build succeeds
- [ ] Version bumped appropriately
- [ ] CHANGELOG.md updated
- [ ] Breaking changes documented
- [ ] Migration guide written (if breaking)
- [ ] Tag pushed to GitHub
- [ ] GitHub Actions workflow succeeded
- [ ] Package published to GitHub Packages
- [ ] Release notes added
- [ ] Consumers notified

## Troubleshooting

### Publish Failed

1. Check GitHub Actions logs
2. Verify `GITHUB_TOKEN` permissions
3. Ensure version doesn't already exist
4. Re-run workflow if transient failure

### Wrong Version Published

1. Deprecate incorrect version
2. Publish correct version
3. Notify consumers

### Tag Already Exists

```bash
# Delete local tag
git tag -d v1.2.3

# Delete remote tag
git push origin :refs/tags/v1.2.3

# Create correct tag
npm version patch
git push origin --tags
```
