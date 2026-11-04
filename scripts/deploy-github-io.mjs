/**
 * Builds the ship folder and syncs it into bykenel/bykenel.github.io/dino-project/
 * → https://bykenel.github.io/dino-project/
 *
 * Prefers the local workspace clone at ../../bykenel.github.io (sibling of cefet-rj).
 * Falls back to cloning into .deploy-github-io/.
 *
 * Usage: node scripts/deploy-github-io.mjs
 * Does not push; commit/push from bykenel.github.io yourself (or pass --push).
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BUILD = path.join(ROOT, 'build');
const SITE_SUBDIR = 'dino-project';
const SHOULD_PUSH = process.argv.includes('--push');

const CANDIDATE_SITES = [
  path.resolve(ROOT, '../../../bykenel.github.io'), // .../dev/bykenel.github.io
  path.resolve(ROOT, '../../bykenel.github.io'),
  path.join(ROOT, '.deploy-github-io'),
];

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...opts,
  });
  if (res.status !== 0) {
    process.exit(res.status ?? 1);
  }
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const name of fs.readdirSync(src)) {
      copyRecursive(path.join(src, name), path.join(dest, name));
    }
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function resolveSiteRoot() {
  for (const candidate of CANDIDATE_SITES) {
    if (candidate.endsWith('.deploy-github-io')) continue;
    if (fs.existsSync(path.join(candidate, '.git'))) {
      return candidate;
    }
  }
  const fallback = path.join(ROOT, '.deploy-github-io');
  if (!fs.existsSync(path.join(fallback, '.git'))) {
    if (fs.existsSync(fallback)) {
      fs.rmSync(fallback, { recursive: true, force: true });
    }
    console.log('Cloning bykenel/bykenel.github.io…');
    run(
      'git',
      ['clone', 'https://github.com/bykenel/bykenel.github.io.git', fallback],
      { cwd: ROOT }
    );
  }
  return fallback;
}

console.log('Building ship folder…');
run(process.execPath, [path.join(ROOT, 'scripts', 'build-ship.mjs')], {
  cwd: ROOT,
});

if (!fs.existsSync(BUILD)) {
  console.error('build/ missing after ship script');
  process.exit(1);
}

const siteRoot = resolveSiteRoot();
const dest = path.join(siteRoot, SITE_SUBDIR);

console.log(`Syncing build/ → ${dest}`);
if (fs.existsSync(dest)) {
  fs.rmSync(dest, { recursive: true, force: true });
}
fs.mkdirSync(dest, { recursive: true });
for (const name of fs.readdirSync(BUILD)) {
  copyRecursive(path.join(BUILD, name), path.join(dest, name));
}

const zipSrc = path.join(ROOT, 'dino-project.zip');
if (fs.existsSync(zipSrc)) {
  fs.copyFileSync(zipSrc, path.join(dest, 'dino-project.zip'));
  console.log('Included dino-project.zip in site folder');
}

console.log(`Ready at https://bykenel.github.io/${SITE_SUBDIR}/`);
console.log(`Files written under: ${dest}`);

if (!SHOULD_PUSH) {
  console.log('Commit/push from the bykenel.github.io repo when ready.');
  console.log('Or re-run with --push to commit and push automatically.');
  process.exit(0);
}

run('git', ['add', SITE_SUBDIR], { cwd: siteRoot });
const status = spawnSync('git', ['status', '--porcelain', '--', SITE_SUBDIR], {
  cwd: siteRoot,
  encoding: 'utf8',
  shell: process.platform === 'win32',
});
if (!status.stdout.trim()) {
  console.log('No changes to deploy.');
  process.exit(0);
}

const stamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
run(
  'git',
  ['commit', '-m', `Deploy Desert Revenge to ${SITE_SUBDIR}/ (${stamp})`],
  { cwd: siteRoot }
);
run('git', ['push', 'origin', 'HEAD'], { cwd: siteRoot });
console.log(`Pushed → https://bykenel.github.io/${SITE_SUBDIR}/`);
