import { setVersion, clearVersion } from './version.js';
import { getPackagesToPublish, npmPublish, npmLogin, prompt } from './publish.js';

const DEFAULT_VERSION = '0.0.1';

export async function initPublish({
  cwd = process.cwd(),
  version = DEFAULT_VERSION,
  dryRun = false,
  login = true,
  yes = false,
} = {}) {
  const rootDir = cwd;

  if (dryRun) {
    console.log('\n*** DRY RUN MODE ***\n');
  }

  // Step 1: npm login
  if (login) {
    await npmLogin({ cwd: rootDir, dryRun });
  }

  // Step 2: Check packages to publish
  console.log('\n--- Checking packages ---\n');
  const { toPublish, skipped } = await getPackagesToPublish(rootDir);

  for (const { name, reason } of skipped) {
    console.log(`  Skip: ${name} (${reason})`);
  }
  for (const { name } of toPublish) {
    console.log(`  Publish: ${name}`);
  }

  if (toPublish.length === 0) {
    console.log('\nNo packages to publish.');
    return;
  }

  // Step 3: Confirm
  if (!yes) {
    const publishAnswer = await prompt(`\nPublish ${toPublish.length} package(s)? (Y/n): `);
    if (publishAnswer.toLowerCase() === 'n') {
      console.log('Publish cancelled.');
      return;
    }
  }

  // Step 4: Set version and publish. Only modify working files once we're
  // committed to publishing, so the dirty window stays as small as possible.
  if (dryRun) {
    console.log(`\n[dry-run] Would set version to ${version}\n`);
    await npmPublish(rootDir, toPublish, { dryRun });
    console.log('\n--- Publish complete! ---\n');
    return;
  }

  try {
    console.log(`\n--- Setting version to ${version} ---\n`);
    setVersion(rootDir, version, { backup: true });
    await npmPublish(rootDir, toPublish, { dryRun });
    console.log('\n--- Publish complete! ---\n');
  } finally {
    // Restore version
    console.log('\n--- Restoring version ---\n');
    clearVersion(rootDir);
  }
}
