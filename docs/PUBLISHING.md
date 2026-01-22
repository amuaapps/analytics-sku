# Publishing to GitHub Packages

This document explains how to publish and consume the analytics-sku package from GitHub Packages using our WVC-compliant versioning strategy.

## Overview

The `@amuaapps/analytics-sku` package is published to GitHub Packages npm registry at:

```
https://npm.pkg.github.com/@amuaapps/analytics-sku
```

## WVC-Compliant Publishing Strategy

We follow a **branch-based versioning** strategy that maps to environments:

| Branch | Environment | Version Format | Dist-tag | Example |
|--------|-------------|----------------|----------|---------|
| `develop` | Development | `X.Y.Z-pr.N` | `dev` | `0.1.0-pr.1` |
| `release` | Staging | `X.Y.Z-rc.N` | `rc` | `0.1.0-rc.1` |
| `main` | Production | `X.Y.Z` | `latest` | `0.1.0` |

### Version Numbering Rules

- **Base version** is defined in `package.json`
- **Prerelease counter** (N) auto-increments based on existing git tags
- **Dist-tags** ensure non-production versions don't become default

## Publishing (Maintainers)

### Automated Publishing (Recommended)

Publishing is **fully automated** via GitHub Actions. Simply push to the appropriate branch:

#### Development Release (Prerelease)

```bash
# Merge your changes to develop
git checkout develop
git merge feature/my-feature
git push origin develop
```

**Result:** Publishes `X.Y.Z-pr.N` with `dev` dist-tag

#### Staging Release (Release Candidate)

```bash
# Merge develop to release
git checkout release
git merge develop
git push origin release
```

**Result:** Publishes `X.Y.Z-rc.N` with `rc` dist-tag

#### Production Release (Stable)

```bash
# Merge release to main
git checkout main
git merge release
git push origin main
```

**Result:** Publishes `X.Y.Z` with `latest` dist-tag

### What the Workflow Does

The `publish-package.yml` workflow automatically:

1. **Determines version** based on branch and existing tags
2. **Runs full test suite** (type check, lint, format, tests with coverage)
3. **Generates types** from JSON schemas
4. **Validates event catalog**
5. **Builds the package**
6. **Publishes to GitHub Packages** with appropriate dist-tag
7. **Creates git tag** (e.g., `v0.1.0-pr.1`)
8. **Creates GitHub Release** with installation instructions

### Path Filters

The workflow only triggers on changes to:
- `package.json` / `package-lock.json`
- `src/**` (source code)
- `schemas/**` (JSON schemas)
- `scripts/**` (build scripts)
- `tsconfig.json` / `tsup.config.ts` (build config)
- `.github/workflows/publish-package.yml` (workflow itself)

**Infrastructure-only changes do NOT trigger publishing.**

### Updating Base Version

To bump the base version in `package.json`:

```bash
# Update package.json version
npm version minor --no-git-tag-version

# Commit the change
git add package.json
git commit -m "chore: bump version to 0.2.0"
git push origin develop
```

The next publish will use the new base version.

## Installing (Consumers)

### Prerequisites

1. **GitHub Personal Access Token** with `read:packages` scope
2. **Access** to the `amuaapps` organization packages

### Setup Authentication

#### Option 1: Project-level `.npmrc`

Create `.npmrc` in your project root:

```
@amuaapps:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Set the `GITHUB_TOKEN` environment variable:

```bash
export GITHUB_TOKEN=your_github_token
npm install
```

#### Option 2: User-level `.npmrc`

Create `~/.npmrc` in your home directory:

```
@amuaapps:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=your_github_token
```

### Install the Package

#### Latest Stable (Production)

```bash
npm install @amuaapps/analytics-sku@latest
# or simply
npm install @amuaapps/analytics-sku
```

#### Release Candidate (Staging)

```bash
npm install @amuaapps/analytics-sku@rc
```

#### Development Prerelease

```bash
npm install @amuaapps/analytics-sku@dev
```

#### Specific Version

```bash
npm install @amuaapps/analytics-sku@0.1.0-rc.1
```

## CI/CD Integration

### GitHub Actions

Add to your workflow:

```yaml
- name: Configure npm for GitHub Packages
  run: |
    echo "@amuaapps:registry=https://npm.pkg.github.com" >> .npmrc
    echo "//npm.pkg.github.com/:_authToken=${{ secrets.GITHUB_TOKEN }}" >> .npmrc

- name: Install dependencies
  run: npm ci
```

### Other CI Systems

Set the `GITHUB_TOKEN` environment variable as a secret, then:

```bash
echo "@amuaapps:registry=https://npm.pkg.github.com" > .npmrc
echo "//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}" >> .npmrc
npm ci
```

## Troubleshooting

### 401 Unauthorized

**Cause:** Invalid or missing authentication token

**Solution:**
1. Verify your token has `read:packages` scope
2. Check token hasn't expired
3. Ensure `.npmrc` is configured correctly

### 404 Not Found

**Cause:** Package doesn't exist or you don't have access

**Solution:**
1. Verify package name: `@amuaapps/analytics-sku`
2. Check you have access to `amuaapps` organization
3. Confirm package has been published

### Permission Denied (Publishing)

**Cause:** Token doesn't have `write:packages` scope

**Solution:**
1. Regenerate token with `write:packages` scope
2. Update `.npmrc` with new token

## Package Versions & Dist-tags

### Available Dist-tags

| Dist-tag | Branch | Description | Stability |
|----------|--------|-------------|-----------|
| `latest` | `main` | Production-ready stable releases | ✅ Stable |
| `rc` | `release` | Release candidates for staging | ⚠️ Pre-release |
| `dev` | `develop` | Development prereleases | 🚧 Unstable |

### Viewing Available Versions

```bash
# View all published versions
npm view @amuaapps/analytics-sku versions

# View latest version for each dist-tag
npm view @amuaapps/analytics-sku dist-tags

# View latest stable version
npm view @amuaapps/analytics-sku version
```

## Security Best Practices

1. **Never commit tokens** to version control
2. **Use environment variables** for tokens in CI/CD
3. **Rotate tokens regularly** (every 90 days recommended)
4. **Use minimal scopes** (read-only for consumers)
5. **Store tokens securely** (use secret managers in production)

## Package Information

View package details:

```bash
npm view @amuaapps/analytics-sku
```

View available versions:

```bash
npm view @amuaapps/analytics-sku versions
```

View latest version:

```bash
npm view @amuaapps/analytics-sku version
```

## Related Documentation

- [Versioning Strategy](./GOVERNANCE.md#versioning-strategy)
- [Release Process](./RELEASES.md)
- [Consumer Integration Guide](./INTEGRATION.md)
