import { writeFileSync, existsSync, copyFileSync, unlinkSync } from 'fs';
import { join as joinPath } from 'path';
import { readPackageFileSync, writePackageFileSync, getProjectPaths } from './package.js';

const versionFileName = 'src/version.js';
const packageFileName = 'package.json';
const backupSuffix = '.bak';

function writeVersionFile(rootDir, path, version) {
  const filePath = joinPath(rootDir, path, versionFileName);
  if (existsSync(filePath)) {
    writeFileSync(filePath, `export default '${version}';`);
  }
}

function backupFile(rootDir, path, fileName) {
  const filePath = joinPath(rootDir, path, fileName);
  const backupPath = filePath + backupSuffix;
  if (existsSync(filePath)) {
    copyFileSync(filePath, backupPath);
  }
}

function restoreFile(rootDir, path, fileName) {
  const filePath = joinPath(rootDir, path, fileName);
  const backupPath = filePath + backupSuffix;
  if (existsSync(backupPath)) {
    copyFileSync(backupPath, filePath);
    unlinkSync(backupPath);
  }
}

function getProjects(rootDir) {
  // find workspaces (a single, non-workspace package is treated as the only project)
  const projectPaths = getProjectPaths(rootDir);
  const projects = [];
  const projectPathToModuleName = {};

  // collect some info
  for (const projectPath of projectPaths) {
    const project = readPackageFileSync(joinPath(rootDir, projectPath));
    if (!project) {
      continue;
    }
    !project.private && projects.push({ projectPath, project });
    projectPathToModuleName[projectPath] = project.name;
  }

  return { projects, projectPathToModuleName };
}

function overwriteDependencyVersions(dependencies, version, projectPathToModuleName) {
  if (!dependencies) {
    return;
  }
  for (const moduleName in dependencies) {
    const oldVersion = dependencies[moduleName];
    if (oldVersion === '*' || (oldVersion.startsWith('file:') && projectPathToModuleName[oldVersion.substring(5)] === moduleName)) {
      dependencies[moduleName] = version;
    }
  }
}

export function setVersion(rootDir, version, { backup = false } = {}) {
  const { projects, projectPathToModuleName } = getProjects(rootDir);

  for (const { projectPath, project } of projects) {
    if (backup) {
      backupFile(rootDir, projectPath, packageFileName);
      backupFile(rootDir, projectPath, versionFileName);
    }
    overwriteDependencyVersions(project.dependencies, version, projectPathToModuleName);
    overwriteDependencyVersions(project.devDependencies, version, projectPathToModuleName);
    overwriteDependencyVersions(project.peerDependencies, version, projectPathToModuleName);
    project.version = version;
    writePackageFileSync(joinPath(rootDir, projectPath), project);
    writeVersionFile(rootDir, projectPath, version);
  }

  console.log(`Version set to ${version}`);
}

export function clearVersion(rootDir) {
  const { projects } = getProjects(rootDir);

  for (const { projectPath } of projects) {
    restoreFile(rootDir, projectPath, packageFileName);
    restoreFile(rootDir, projectPath, versionFileName);
  }

  console.log(`Version cleared`);
}
