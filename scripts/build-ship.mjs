/**
 * Builds a shippable copy under /build with comments from our Revenge work removed.
 * Chromium Authors / BSD copyright headers are preserved.
 * Also writes dino-project.zip at the repo root (contents of build/).
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'build');

/** Files we authored entirely — strip every comment. */
const OURS = new Set([
  'script.js',
  'custom.css',
  'resources/dino_game/revenge_config.js',
  'resources/dino_game/game_hud.js',
  'resources/dino_game/dino_ai.js',
  'resources/dino_game/economy.js',
  'resources/dino_game/projectile.js',
]);

/** Runtime paths to copy (relative to ROOT). */
const COPY_PATHS = [
  'index.html',
  'script.js',
  'trex.css',
  'custom.css',
  'resources/constants.js',
  'resources/dino_game',
  'images/default_100_percent/100-offline-sprite.png',
  'images/default_200_percent/200-offline-sprite.png',
];

/** Comments added/changed for Desert Revenge — strip these from Chromium-based files. */
const OUR_COMMENT_RE =
  /@change|\bRevenge\b|revenge_config|game_hud|dino_ai|slowTimer|slow effect|escape-only|escape only|duck lock|duckTarget|Min-hold|trailing-edge|anti-flicker|Skip CSS intro|Disabled Singleton|Refactored Functional|CUSTOM STYLING|Pixel UI|Game Instance|Player-paid spawn|clicker\/spawner|victory\/defeat|spawn hotkeys|CSS intro|ANIM_END/i;

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function rimraf(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function listFilesRecursive(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listFilesRecursive(full));
    } else {
      out.push(full);
    }
  }
  return out;
}

function isChromiumKeep(text) {
  return /Chromium Authors|BSD-style license|Copyright \d{4}/i.test(text);
}

/**
 * Strip JS/CSS comments. Preserves string/template contents.
 * @param {string} source
 * @param {'strip-all'|'strip-ours'} mode
 */
function stripCodeComments(source, mode) {
  let i = 0;
  let out = '';
  const n = source.length;

  const peek = (k = 0) => source[i + k] || '';
  const startsWith = (s) => source.startsWith(s, i);

  const shouldKeep = (comment) => {
    if (mode === 'strip-all') return false;
    if (isChromiumKeep(comment)) return true;
    return !OUR_COMMENT_RE.test(comment);
  };

  while (i < n) {
    if (peek() === '"' || peek() === "'" || peek() === '`') {
      const q = peek();
      out += q;
      i++;
      while (i < n) {
        const c = peek();
        out += c;
        i++;
        if (c === '\\') {
          out += peek();
          i++;
          continue;
        }
        if (c === q) break;
        if (q === '`' && c === '$' && peek() === '{') {
          out += '{';
          i++;
          let depth = 1;
          while (i < n && depth > 0) {
            const ch = peek();
            if (ch === '"' || ch === "'" || ch === '`') {
              const nq = ch;
              out += ch;
              i++;
              while (i < n) {
                const nc = peek();
                out += nc;
                i++;
                if (nc === '\\') {
                  out += peek();
                  i++;
                } else if (nc === nq) break;
              }
              continue;
            }
            if (ch === '{') depth++;
            if (ch === '}') depth--;
            out += ch;
            i++;
          }
        }
      }
      continue;
    }

    if (startsWith('//')) {
      let j = i + 2;
      while (j < n && source[j] !== '\n') j++;
      const comment = source.slice(i, j);
      if (shouldKeep(comment)) out += comment;
      i = j;
      continue;
    }

    if (startsWith('/*')) {
      let j = i + 2;
      while (j < n - 1 && !(source[j] === '*' && source[j + 1] === '/')) j++;
      j = Math.min(j + 2, n);
      const comment = source.slice(i, j);
      if (shouldKeep(comment)) {
        out += comment;
      } else if (comment.includes('\n')) {
        out += '\n';
      }
      i = j;
      continue;
    }

    out += peek();
    i++;
  }

  return out.replace(/\n{3,}/g, '\n\n');
}

function stripHtmlComments(html) {
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

function processTextFile(rel, content) {
  const norm = rel.replace(/\\/g, '/');
  if (norm.endsWith('.html')) {
    return stripHtmlComments(content);
  }
  if (/\.(js|css)$/.test(norm)) {
    const mode = OURS.has(norm) ? 'strip-all' : 'strip-ours';
    return stripCodeComments(content, mode);
  }
  return content;
}

function copyProcessed(relFromRoot) {
  const src = path.join(ROOT, relFromRoot);
  if (!fs.existsSync(src)) {
    console.warn('missing:', relFromRoot);
    return;
  }
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    for (const file of listFilesRecursive(src)) {
      const rel = path.relative(ROOT, file);
      copyProcessed(rel);
    }
    return;
  }

  const dest = path.join(OUT, relFromRoot);
  ensureDir(path.dirname(dest));
  const ext = path.extname(src).toLowerCase();
  if (['.js', '.css', '.html'].includes(ext)) {
    const raw = fs.readFileSync(src, 'utf8');
    const cleaned = processTextFile(relFromRoot, raw);
    fs.writeFileSync(dest, cleaned, 'utf8');
  } else {
    fs.copyFileSync(src, dest);
  }
}

rimraf(OUT);
ensureDir(OUT);

for (const p of COPY_PATHS) {
  copyProcessed(p);
}

// Disable Jekyll on GitHub Pages so ES modules / static assets are served as-is.
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');

fs.writeFileSync(
  path.join(OUT, 'README.txt'),
  [
    'Desert Revenge — ship build',
    '',
    'Live: https://bykenel.github.io/dino-project/',
    'Zip:  https://bykenel.github.io/dino-project/dino-project.zip',
    'Host repo: bykenel/bykenel.github.io (folder dino-project/)',
    'Source: https://github.com/bykenel/dino-project',
    '',
    'From the source repo:',
    '  node scripts/deploy-github-io.mjs',
    '  node scripts/deploy-github-io.mjs --push',
    '',
    'Local preview (ES modules need HTTP):',
    '  npx serve .',
    '',
  ].join('\n'),
  'utf8'
);

const zipPath = path.join(ROOT, 'dino-project.zip');
if (fs.existsSync(zipPath)) fs.rmSync(zipPath);
const zip = spawnSync(
  'tar',
  ['-a', '-cf', zipPath, '-C', OUT, '.'],
  { stdio: 'inherit', shell: process.platform === 'win32' }
);
if (zip.status !== 0) {
  console.error('Failed to create dino-project.zip');
  process.exit(zip.status ?? 1);
}

console.log('Ship build written to', OUT);
console.log('Zip written to', zipPath);
