#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const TARGETS = ['chrome-mv3', 'firefox-mv3'];
const OUTPUT_ROOT = path.join(process.cwd(), '.output');

const ALLOWED_TOP_LEVEL = new Set([
  'manifest.json',
  'newtab.html',
  'popup.html',
  'background.js',
  'chunks',
  'assets',
  '_locales',
  'icon',
  'images',
]);

const FORBIDDEN_PATTERNS = [
  /(^|\/)e2e-fixtures(\/|$)/,
  /(^|\/)wxt\.svg$/,
  /(^|\/)\.DS_Store$/,
  /\.map$/,
];

const MAX_TOTAL_BYTES = 2 * 1024 * 1024;

const errors = [];

const walk = (dir, base = '') => {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const childRel = base ? `${base}/${entry.name}` : entry.name;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(abs, childRel));
    else out.push({ rel: childRel, abs, size: fs.statSync(abs).size });
  }
  return out;
};

for (const target of TARGETS) {
  const targetDir = path.join(OUTPUT_ROOT, target);
  if (!fs.existsSync(targetDir)) {
    errors.push(`Missing build output: ${targetDir}`);
    continue;
  }

  const topLevel = fs.readdirSync(targetDir);
  for (const entry of topLevel) {
    if (!ALLOWED_TOP_LEVEL.has(entry)) {
      errors.push(`${target}: unexpected top-level entry "${entry}"`);
    }
  }

  const files = walk(targetDir);
  for (const file of files) {
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.test(file.rel)) {
        errors.push(`${target}: forbidden file matches ${pattern} → ${file.rel}`);
      }
    }
  }

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  if (totalSize > MAX_TOTAL_BYTES) {
    errors.push(`${target}: total size ${(totalSize / 1024 / 1024).toFixed(2)} MB exceeds limit ${(MAX_TOTAL_BYTES / 1024 / 1024).toFixed(2)} MB`);
  }

  const expectedLocales = ['en/messages.json', 'zh_CN/messages.json'];
  for (const locale of expectedLocales) {
    const localePath = path.join(targetDir, '_locales', locale);
    if (!fs.existsSync(localePath)) {
      errors.push(`${target}: missing required locale file _locales/${locale}`);
    }
  }

  const manifestPath = path.join(targetDir, 'manifest.json');
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (manifest.permissions && manifest.permissions.length > 0) {
      errors.push(`${target}: manifest declares permissions ${JSON.stringify(manifest.permissions)} (expected none)`);
    }
    if (!Array.isArray(manifest.host_permissions) || manifest.host_permissions.length === 0) {
      errors.push(`${target}: manifest must declare host_permissions for image hosts`);
    }
    if (manifest.default_locale !== 'en') {
      errors.push(`${target}: default_locale must be "en" (got ${JSON.stringify(manifest.default_locale)})`);
    }
    if (manifest.name !== '__MSG_extensionName__') {
      errors.push(`${target}: manifest.name must use __MSG_extensionName__ placeholder`);
    }
    if (manifest.description !== '__MSG_extensionDescription__') {
      errors.push(`${target}: manifest.description must use __MSG_extensionDescription__ placeholder`);
    }
    if (manifest.action?.default_title !== '__MSG_actionTitle__') {
      errors.push(`${target}: action.default_title must use __MSG_actionTitle__ placeholder`);
    }
  } catch (error) {
    errors.push(`${target}: failed to read manifest.json — ${(error).message}`);
  }
}

if (errors.length > 0) {
  console.error('\n[verify-build-artifacts] FAIL:');
  for (const err of errors) console.error(`  • ${err}`);
  process.exit(1);
}

console.log('[verify-build-artifacts] OK — all artifact checks passed.');
