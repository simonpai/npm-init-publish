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

  try {
    // Step 1: Set version (with backup for restoration)
    console.log(`\n--- Setting version to ${version} ---\n`);
    setVersion(rootDir, version, { backup: true });

    // Step 2: npm login
    if (login) {
      await npmLogin({ cwd: rootDir, dryRun });
    }

    // Step 3: Check packages to publish
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

    // Step 4: Confirm and publish
    if (!yes) {
      const publishAnswer = await prompt(`\nPublish ${toPublish.length} package(s)? (Y/n): `);
      if (publishAnswer.toLowerCase() === 'n') {
        console.log('Publish cancelled.');
        return;
      }
    }
    await npmPublish(rootDir, toPublish, { dryRun });

    console.log('\n--- Publish complete! ---\n');
  } finally {
    // Restore version
    console.log('\n--- Restoring version ---\n');
    clearVersion(rootDir);
  }
}
