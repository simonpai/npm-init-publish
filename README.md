# npm-init-publish

A small CLI to **set a version across your packages, then publish the public ones that aren't on npm yet** — and restore your working tree afterwards.

It works for both a single package and an npm **workspaces** monorepo. For each package it will:

1. Set the version (in `package.json`, and in `src/version.js` if present), backing up the originals first.
2. Optionally run `npm login`.
3. Skip packages that are `private` or already published to npm.
4. Publish the rest with `npm publish --access public`.
5. Restore the original `package.json` / `version.js` files from backup.

Workspace dependencies declared as `"*"` or `"file:<path>"` are rewritten to the published version during the run, then restored.

## Usage

```bash
npx npm-init-publish [version] [options]
```

Run it from the root of your project (or pass `--cwd`). The `version` positional defaults to `0.0.1`.

### Options

| Option              | Default       | Description                                              |
| ------------------- | ------------- | -------------------------------------------------------- |
| `--dry-run`,`--dry` | `false`       | Print what would happen without logging in or publishing |
| `--no-login`        | login enabled | Skip the `npm login` step                                |
| `--yes`, `-y`       | `false`       | Skip the confirmation prompt                             |
| `--cwd <dir>`       | current dir   | Project root directory                                   |

### Examples

```bash
# See what would be published, without touching npm
npx npm-init-publish 1.0.0 --dry-run

# Publish at 1.0.0, no prompt, assuming you're already logged in
npx npm-init-publish 1.0.0 --yes --no-login
```

## Extra commands

```bash
# Set the version across all packages (permanent — no backup/restore)
npx npm-init-publish set-version 1.2.3

# Restore package.json / version files from their .bak backups
npx npm-init-publish clear-version
```

## Programmatic API

```js
import { initPublish, setVersion, clearVersion } from 'npm-init-publish';

await initPublish({ cwd: process.cwd(), version: '1.0.0', dryRun: true });
```

## License

MIT
