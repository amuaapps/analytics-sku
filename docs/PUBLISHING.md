# Publishing to GitHub Packages

This document explains how to publish and consume the analytics-sku package from GitHub Packages.

## Overview

The `@amuaapps/analytics-sku` package is published to GitHub Packages npm registry at:

```
https://npm.pkg.github.com/@amuaapps/analytics-sku
```

## Publishing (Maintainers)

### Prerequisites

1. **GitHub Personal Access Token** with `write:packages` scope
2. **Maintainer access** to the `amuaapps/analytics-sku` repository
3. **NPM authentication** configured

### Setup Authentication

Create a `.npmrc` file in your home directory (`~/.npmrc`):

```
@amuaapps:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

**Generate a token:**
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: `write:packages`, `read:packages`
4. Copy the token and replace `YOUR_GITHUB_TOKEN` above

### Manual Publishing

```bash
# Ensure you're on the correct branch
git checkout main

# Update version (see VERSIONING.md)
npm version patch  # or minor, or major

# Build the package
npm run build

# Publish to GitHub Packages
npm publish
```

### Automated Publishing (Recommended)

Publishing is automated via GitHub Actions when you push a git tag:

```bash
# Create and push a version tag
npm version patch
git push origin main --tags
```

The GitHub Actions workflow will:
1. Run tests and linting
2. Build the package
3. Publish to GitHub Packages
4. Create a GitHub Release

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

```bash
npm install @amuaapps/analytics-sku
```

### Install Specific Version

```bash
npm install @amuaapps/analytics-sku@1.2.3
```

### Install Pre-release Version

```bash
npm install @amuaapps/analytics-sku@next
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

## Package Versions

### Latest Stable

```bash
npm install @amuaapps/analytics-sku@latest
```

### Pre-release Tags

- `next`: Latest from `develop` branch
- `beta`: Beta releases
- `rc`: Release candidates

```bash
npm install @amuaapps/analytics-sku@next
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
