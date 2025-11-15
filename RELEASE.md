# Release Process

This document describes how to release `loveops-world-model` to npm.

## Prerequisites

1. **npm account**: You must have an npm account and be logged in
   ```bash
   npm login
   ```

2. **Build tools**: Ensure pnpm is installed
   ```bash
   corepack enable
   corepack prepare pnpm@latest --activate
   ```

## Release Steps

### 1. Update Version

Update the version in `package.json` following [semantic versioning](https://semver.org/):
- **Patch** (0.1.0 → 0.1.1): Bug fixes
- **Minor** (0.1.0 → 0.2.0): New features, backward compatible
- **Major** (0.1.0 → 1.0.0): Breaking changes

```bash
# Option 1: Manual edit
# Edit package.json and update "version" field

# Option 2: Use npm version (creates git tag)
npm version patch   # or minor, major
```

### 2. Build and Test

Ensure the package builds successfully:

```bash
pnpm run clean
pnpm run build
```

### 3. Verify Package Contents

Check what will be published:

```bash
npm pack --dry-run
```

This should show:
- `dist/` - Compiled TypeScript output
- `bin/` - CLI binary
- `README.md` - Documentation
- `LICENSE` - License file
- `package.json` - Package metadata

### 4. Publish to npm

#### Dry Run (Recommended First)

Test the publish process without actually publishing:

```bash
npm publish --dry-run
```

#### Publish to npm

```bash
# Public package (default)
npm publish

# Or use the release script
pnpm run release
```

#### Publish to a Different Registry

```bash
# Scoped package to organization
npm publish --access public

# Private registry
npm publish --registry https://your-registry.com
```

### 5. Verify Publication

Check that the package is available:

```bash
npm view loveops-world-model
```

Or visit: https://www.npmjs.com/package/loveops-world-model

## Automated Release (CI/CD)

For automated releases, you can use GitHub Actions or similar CI/CD:

```yaml
# Example GitHub Actions workflow
name: Release
on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      - run: pnpm install --frozen-lockfile
      - run: pnpm run build
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Installing the Published Package

Once published, users can install it:

```bash
# Using npm
npm install loveops-world-model

# Using pnpm
pnpm add loveops-world-model

# Using yarn
yarn add loveops-world-model
```

## Troubleshooting

### "Package name already exists"

If the package name is taken, you'll need to:
1. Use a scoped package: `@your-org/loveops-world-model`
2. Or choose a different name

### "You must verify your email"

Verify your npm account email before publishing.

### "Insufficient permissions"

Ensure you're logged in and have publish permissions for the package/scope.

## Post-Release

After publishing:

1. **Create a Git Tag** (if not using `npm version`):
   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```

2. **Update CHANGELOG** (if you maintain one)

3. **Announce** the release to your team/users

