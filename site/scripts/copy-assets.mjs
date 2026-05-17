import { mkdir, copyFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');
const sitePublic = resolve(here, '..', 'public');

const ASSETS = [
  ['demo.gif', 'demo.gif'],
  ['assets/icon-source.svg', 'icon.svg'],
];

for (const [src, dst] of ASSETS) {
  const from = resolve(repoRoot, src);
  const to = resolve(sitePublic, dst);
  await mkdir(dirname(to), { recursive: true });
  await copyFile(from, to);
  console.log(`copied ${src} -> public/${dst}`);
}
