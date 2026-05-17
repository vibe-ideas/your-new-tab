import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from '@playwright/test';

const extensionPath = path.join(process.cwd(), '.output', 'chrome-mv3');
const outputDir = path.join(process.cwd(), 'docs', 'store-screenshots');
const viewport = { width: 1280, height: 800 };

function findImageMagickBinary() {
  for (const binary of ['magick', 'convert']) {
    try {
      execFileSync(binary, ['-version'], { stdio: 'ignore' });
      return binary;
    } catch {
      // try next
    }
  }
  throw new Error('ImageMagick is required: neither "magick" nor "convert" was found.');
}

async function launchExtension() {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'your-new-tab-store-'));
  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    headless: true,
    viewport,
    deviceScaleFactor: 1,
    args: [
      '--disable-crash-reporter',
      '--disable-crashpad',
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });

  let [serviceWorker] = context.serviceWorkers();
  if (!serviceWorker) {
    serviceWorker = await context.waitForEvent('serviceworker');
  }
  const extensionId = new URL(serviceWorker.url()).host;

  return {
    context,
    extensionId,
    async cleanup() {
      await context.close();
      fs.rmSync(userDataDir, { recursive: true, force: true });
    },
  };
}

async function openExtensionPage(context, extensionId, pageName) {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/${pageName}.html`);
  return page;
}

async function disableMotion(page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        transition-duration: 0s !important;
        caret-color: transparent !important;
      }
      html { scroll-behavior: auto !important; }
    `,
  });
}

async function seedSearchHistory(page) {
  await page.evaluate(() => {
    window.localStorage.setItem(
      'searchHistory',
      JSON.stringify([
        'best mcp servers for coding',
        'react 19 actions vs useTransition',
        'agentic browser workspace',
      ]),
    );
  });
}

async function flattenToOpaquePng(magick, srcPath, destPath) {
  execFileSync(magick, [
    srcPath,
    '-background', 'white',
    '-alpha', 'remove',
    '-alpha', 'off',
    '-type', 'TrueColor',
    'PNG24:' + destPath,
  ]);
}

async function capture(page, magick, label) {
  const tmpPath = path.join(outputDir, `${label}.raw.png`);
  const finalPath = path.join(outputDir, `${label}.png`);
  await page.waitForTimeout(300);
  await page.screenshot({ path: tmpPath, fullPage: false, omitBackground: false });
  await flattenToOpaquePng(magick, tmpPath, finalPath);
  fs.rmSync(tmpPath);
  console.log(`  wrote ${finalPath}`);
}

async function main() {
  if (!fs.existsSync(extensionPath)) {
    throw new Error(`Missing build output: ${extensionPath}. Run "pnpm run build" first.`);
  }
  fs.mkdirSync(outputDir, { recursive: true });
  const magick = findImageMagickBinary();

  let extension;
  try {
    extension = await launchExtension();

    const newTabPage = await openExtensionPage(extension.context, extension.extensionId, 'newtab');
    await newTabPage.waitForLoadState('domcontentloaded');
    await newTabPage.locator('.search-box').waitFor();
    await disableMotion(newTabPage);

    await seedSearchHistory(newTabPage);
    await newTabPage.reload();
    await newTabPage.locator('.search-box').waitFor();
    await disableMotion(newTabPage);
    await newTabPage.locator('.shortcut-label').first().waitFor();

    await capture(newTabPage, magick, '01-newtab-overview');

    await newTabPage.locator('.search-provider-icon').click();
    await newTabPage.locator('.provider-popover').waitFor();
    await capture(newTabPage, magick, '02-provider-menu');

    await newTabPage.keyboard.press('Escape');
    await newTabPage.locator('.search-input').click();
    await newTabPage.locator('.search-input').fill('how does prompt caching work in claude?');
    await capture(newTabPage, magick, '03-search-typed');
  } finally {
    if (extension) {
      await extension.cleanup();
    }
  }

  console.log(`\nScreenshots saved to: ${outputDir}`);
  console.log('Format: 1280x800, 24-bit PNG (no alpha) — ready for Chrome Web Store.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
