// Copy dist/index.html into dist/c/<slug>/index.html for every concept
// and dist/d/<id>/index.html for every domain, so GitHub Pages serves
// shared URLs with HTTP 200 + the same OG preview as the homepage.
// Otherwise those routes fall through to 404.html and stricter crawlers
// (Facebook, LinkedIn) skip 404 responses.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dist = path.join(root, 'dist');
const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf-8');

function write(routePath) {
  const out = path.join(dist, routePath, 'index.html');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
}

const conceptsRoot = path.join(root, 'src', 'concepts');
for (const dir of fs.readdirSync(conceptsRoot, { withFileTypes: true })) {
  if (!dir.isDirectory()) continue;
  const metaPath = path.join(conceptsRoot, dir.name, 'meta.js');
  if (!fs.existsSync(metaPath)) continue;
  const { meta } = await import(pathToFileURL(metaPath).href);
  if (meta?.slug) write(`c/${meta.slug}`);
}

const { DOMAINS } = await import(
  pathToFileURL(path.join(root, 'src', 'data', 'domains.js')).href
);
for (const d of DOMAINS) {
  if (d?.id) write(`d/${d.id}`);
}
