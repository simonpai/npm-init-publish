import { spawn } from 'child_process';
import { createInterface } from 'readline';
import { join as joinPath } from 'path';
import { readPackageFileSync, getProjectPaths } from './package.js';

export function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: 'inherit',
      ...options,
    });
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} exited with code ${code}`));
      }
    });
    proc.on('error', reject);
  });
}

export function packageExistsOnNpm(packageName, options = {}) {
  return new Promise((resolve) => {
    const proc = spawn('npm', ['view', packageName], {
      stdio: 'ignore',
      ...options,
    });
    proc.on('close', (code) => {
      resolve(code === 0);
    });
    proc.on('error', () => {
      resolve(false);
    });
  });
}

export function prompt(question) {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export async function npmLogin({ cwd, dryRun = false } = {}) {
  console.log('\n--- npm login ---\n');
  if (dryRun) {
    console.log('[dry-run] Would run: npm login');
    return;
  }
  await run('npm', ['login'], { cwd });
}

export async function getPackagesToPublish(rootDir) {
  const projectPaths = getProjectPaths(rootDir);
  const toPublish = [];
  const skipped = [];

  for (const projectPath of projectPaths) {
    const project = readPackageFileSync(joinPath(rootDir, projectPath));
    if (!project) {
      continue;
    }
    if (project.private) {
      skipped.push({ name: project.name, reason: 'private' });
      continue;
    }
    const exists = await packageExistsOnNpm(project.name, { cwd: rootDir });
    if (exists) {
      skipped.push({ name: project.name, reason: 'already exists on npm' });
      continue;
    }
    toPublish.push({ projectPath, name: project.name });
  }

  return { toPublish, skipped };
}

export async function npmPublish(rootDir, packages, { dryRun = false } = {}) {
  console.log('\n--- npm publish ---\n');

  for (const { projectPath, name } of packages) {
    if (dryRun) {
      console.log(`[dry-run] Would publish: ${name}`);
    } else {
      console.log(`Publishing ${name}...`);
      await run('npm', ['publish', '--access', 'public'], {
        cwd: joinPath(rootDir, projectPath),
      });
    }
  }
}
