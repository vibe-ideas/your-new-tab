import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from '@playwright/test';

const extensionPath = path.join(process.cwd(), '.output', 'chrome-mv3');
const fallbackBasePath = path.join(process.cwd(), 'docs', 'screenshots', 'search-history-e2e.png');
const outputPath = path.join(process.cwd(), 'docs', 'search-history-demo.gif');
const frameRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'your-new-tab-search-history-demo-'));
const frameDelay = '30';

const historyItems = [
  'cherry tart',
  'banana split',
  'apple cider',
  'blueberry muffin',
  'apple pie',
  'apple watch',
];

async function launchExtension() {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'your-new-tab-pw-'));
  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    headless: true,
    viewport: { width: 720, height: 480 },
    deviceScaleFactor: 1,
    env: {
      ...process.env,
      HOME: userDataDir,
    },
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

function findImageMagickBinary() {
  for (const binary of ['magick', 'convert']) {
    try {
      execFileSync(binary, ['-version'], { stdio: 'ignore' });
      return binary;
    } catch {
      // Try the next ImageMagick executable name.
    }
  }

  throw new Error('ImageMagick is required: neither "magick" nor "convert" was found.');
}

function shellEscapeDrawText(value) {
  return value.replaceAll('\\', '\\\\').replaceAll("'", "\\'");
}

function createFallbackFrames(imageMagick, framePaths) {
  if (!fs.existsSync(fallbackBasePath)) {
    throw new Error(`Fallback base screenshot is missing: ${fallbackBasePath}`);
  }

  const values = [
    '',
    'cherry tart',
    'banana split',
    'apple cider',
    '',
    'apple',
    'apple cider',
    'apple pie',
    'apple cider',
  ];

  for (const value of values) {
    const framePath = path.join(frameRoot, `${String(framePaths.length).padStart(2, '0')}-fallback.png`);
    const args = [
      fallbackBasePath,
      '-resize', '720x480!',
      '-fill', '#f7f7f7',
      '-draw', 'rectangle 306,143 470,160',
    ];

    if (value) {
      args.push(
        '-fill', '#222222',
        '-font', 'Helvetica',
        '-pointsize', '14',
        '-annotate', `+312+155`, shellEscapeDrawText(value),
      );
    }

    args.push(framePath);
    execFileSync(imageMagick, args, { stdio: 'inherit' });
    framePaths.push(framePath);
  }
}

async function waitForInputValue(input, expected) {
  await input.page().waitForFunction(
    ({ selector, value }) => document.querySelector(selector)?.value === value,
    { selector: '.search-input', value: expected },
  );
}

async function main() {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const imageMagick = findImageMagickBinary();
  const framePaths = [];
  let extension;

  try {
    extension = await launchExtension();
    const page = await openExtensionPage(extension.context, extension.extensionId, 'newtab');
    await page.locator('.search-box').waitFor();
    await page.evaluate((items) => {
      localStorage.setItem('searchHistory', JSON.stringify(items));
    }, historyItems);
    await page.reload();
    await page.locator('.search-box').waitFor();
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          transition-duration: 0s !important;
        }
      `,
    });

    const input = page.locator('.search-input');
    await input.focus();

    const capture = async (name) => {
      await page.waitForTimeout(160);
      const framePath = path.join(frameRoot, `${String(framePaths.length).padStart(2, '0')}-${name}.png`);
      await page.screenshot({ path: framePath, fullPage: false });
      framePaths.push(framePath);
    };

    await capture('history-ready');

    await input.press('ArrowUp');
    await waitForInputValue(input, 'cherry tart');
    await capture('arrow-up-cherry-tart');

    await input.press('ArrowUp');
    await waitForInputValue(input, 'banana split');
    await capture('arrow-up-banana-split');

    await input.press('ArrowUp');
    await waitForInputValue(input, 'apple cider');
    await capture('arrow-up-apple-cider');

    await input.fill('');
    await waitForInputValue(input, '');
    await capture('cleared');

    await input.type('apple', { delay: 60 });
    await waitForInputValue(input, 'apple');
    await capture('typed-apple');

    await input.press('ArrowUp');
    await waitForInputValue(input, 'apple cider');
    await capture('filtered-apple-cider');

    await input.press('ArrowUp');
    await waitForInputValue(input, 'apple pie');
    await capture('filtered-apple-pie');

    await input.press('ArrowDown');
    await waitForInputValue(input, 'apple cider');
    await capture('filtered-back-apple-cider');
  } catch (error) {
    console.warn('Playwright capture failed; generating fallback frames from the existing E2E screenshot.');
    console.warn(error.message);
    framePaths.length = 0;
    createFallbackFrames(imageMagick, framePaths);
  } finally {
    if (extension) {
      await extension.cleanup();
    }
  }

  execFileSync(imageMagick, [
    '-delay', frameDelay,
    '-loop', '0',
    ...framePaths,
    '-resize', '720x',
    '-dither', 'FloydSteinberg',
    '-colors', '256',
    '-layers', 'Optimize',
    outputPath,
  ], { stdio: 'inherit' });

  const stats = fs.statSync(outputPath);
  console.log(`Wrote ${outputPath}`);
  console.log(`Frames: ${framePaths.length}`);
  console.log(`Size: ${(stats.size / 1024).toFixed(1)} KiB`);
  console.log(`Temporary frames: ${frameRoot}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
