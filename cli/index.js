#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { initPublish } from '../lib/init-publish.js';
import { setVersion, clearVersion } from '../lib/version.js';

const cwdOption = {
  describe: 'Project root directory',
  type: 'string',
  default: process.cwd(),
};

yargs(hideBin(process.argv))
  .scriptName('npm-init-publish')
  .command(
    '$0 [version]',
    'Set versions, npm login, publish unpublished public packages, then restore versions',
    (y) =>
      y
        .positional('version', {
          describe: 'Version to publish under',
          type: 'string',
          default: '0.0.1',
        })
        .option('dry-run', {
          alias: 'dry',
          describe: 'Print what would happen without logging in or publishing',
          type: 'boolean',
          default: false,
        })
        .option('login', {
          describe: 'Run `npm login` before publishing (use --no-login to skip)',
          type: 'boolean',
          default: true,
        })
        .option('yes', {
          alias: 'y',
          describe: 'Skip the confirmation prompt',
          type: 'boolean',
          default: false,
        })
        .option('cwd', cwdOption),
    async (argv) => {
      await initPublish({
        cwd: argv.cwd,
        version: argv.version,
        dryRun: argv.dryRun,
        login: argv.login,
        yes: argv.yes,
      });
    },
  )
  .command(
    'set-version <version>',
    'Set the version across all workspace packages (no backup, no restore)',
    (y) =>
      y
        .positional('version', { describe: 'Version to set', type: 'string' })
        .option('cwd', cwdOption),
    (argv) => {
      setVersion(argv.cwd, argv.version);
    },
  )
  .command(
    'clear-version',
    'Restore package.json / version files from their .bak backups',
    (y) => y.option('cwd', cwdOption),
    (argv) => {
      clearVersion(argv.cwd);
    },
  )
  .version(false)
  .strict()
  .alias('h', 'help')
  .fail((msg, err, y) => {
    console.error('\nError:', err ? err.message : msg);
    process.exit(1);
  })
  .parseAsync()
  .catch((error) => {
    console.error('\nError:', error.message);
    process.exit(1);
  });
