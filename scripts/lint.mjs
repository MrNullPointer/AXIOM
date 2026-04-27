// Minimal dep-free lint pass. Runs `node --check` on every plain .js
// and .mjs file (configs, build tooling, data) to catch syntax errors
// before they reach the bundler. Skips node_modules / dist / .git and
// anything inside .jsx (Node's parser doesn't understand JSX) — the
// bundler covers those at build time.
//
// Run:  npm run lint
import { execFileSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = dirname(dirname(fileURLToPath(import.meta.url)));
const SKIP = new Set(['node_modules', 'dist', '.git', '.claude']);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const full = join(dir, name);
    const s = statSync(full);
    if (s.isDirectory()) walk(full, out);
    else if (full.endsWith('.mjs') || full.endsWith('.js')) out.push(full);
  }
  return out;
}

const files = walk(repo);
const failed = [];

for (const f of files) {
  try {
    execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' });
  } catch (err) {
    failed.push({
      file: relative(repo, f),
      msg: (err.stderr?.toString() || err.message).trim(),
    });
  }
}

if (failed.length) {
  console.error(`✖ lint: ${failed.length} file(s) failed syntax check\n`);
  for (const { file, msg } of failed) {
    console.error(`  ${file}`);
    console.error(`    ${msg.split('\n').slice(0, 2).join('\n    ')}\n`);
  }
  process.exit(1);
}

console.log(`✔ lint: ${files.length} .js/.mjs files OK`);
