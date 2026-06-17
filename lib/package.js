import { createRequire } from 'module';
import { dirname, join as joinPath } from 'path';
import { writeFileSync, existsSync, mkdirSync } from 'fs';

const require = createRequire(import.meta.url);

const PACKAGE_FILE_NAME = 'package.json';

export function readPackageFileSync(path) {
  const file = joinPath(path, PACKAGE_FILE_NAME);
  if (!existsSync(file)) {
    return undefined;
  }
  // require caches by path; bust it so re-reads after a write see fresh data
  delete require.cache[require.resolve(file)];
  return require(file);
}

// Resolve the list of package directories (relative to rootDir) to operate on.
// Falls back to the root itself ('.') for a plain, non-monorepo package.
export function getProjectPaths(rootDir) {
  const root = readPackageFileSync(rootDir);
  if (!root) {
    throw new Error(`No package.json found in ${rootDir}`);
  }
  return root.workspaces && root.workspaces.length ? root.workspaces : ['.'];
}

export function writePackageFileSync(path, data) {
  const file = joinPath(path, PACKAGE_FILE_NAME);
  if (!existsSync(file)) {
    mkdirSync(dirname(file), { recursive: true });
  }
  writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
}
