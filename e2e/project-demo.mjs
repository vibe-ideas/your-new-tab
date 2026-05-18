import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const extensionPath = path.join(process.cwd(), '.output', 'chrome-mv3');
const outputPath = path.join(process.cwd(), 'demo.gif');
const frameRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'your-new-tab-project-demo-'));
const serverUrl = 'http://127.0.0.1:4174';
const imageBackgroundUrl = `${serverUrl}/demo.gif?variant=1`;
const videoBackgroundUrl = `${serverUrl}/e2e/fixtures/flower.mp4`;
const viewport = { width: 1280, height: 800 };
const frameDelay = '14';

const directJsonBookmarks = JSON.stringify([
  {
    id: 'demo-bookmark-1',
    title: 'Docs',
    url: 'https://example.com/docs',
  },
  {
    id: 'demo-bookmark-2',
    title: 'Design',
    url: 'https://example.com/design',
  },
  {
    id: 'demo-bookmark-3',
    title: 'Deploy',
    url: 'https://example.com/deploy',
  },
  {
    id: 'demo-bookmark-4',
    title: 'Ideas',
    url: 'https://example.com/ideas',
  },
], null, 2);

function findImageMagickBinary() {
  for (const binary of ['magick', 'convert']) {
    try {
      execFileSync(binary, ['-version'], { stdio: 'ignore' });
      return binary;
    } catch {
      // Try the next executable name.
    }
  }

  throw new Error('ImageMagick is required: neither "magick" nor "convert" was found.');
}

async function waitForHttpReady(url, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { method: 'GET' });
      if (response.ok) {
        return;
      }
    } catch {
      // Keep polling until the server responds.
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Timed out waiting for local server: ${url}`);
}

async function startStaticServer() {
  const server = spawn('python3', ['-m', 'http.server', '4174', '--directory', process.cwd()], {
    stdio: 'ignore',
  });

  try {
    await waitForHttpReady(`${serverUrl}/README.md`);
    return server;
  } catch (error) {
    server.kill('SIGTERM');
    throw error;
  }
}

async function launchExtension() {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'your-new-tab-pw-'));
  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    headless: true,
    viewport,
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

async function disableMotion(page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        transition-duration: 0s !important;
        caret-color: transparent !important;
      }
      html {
        scroll-behavior: auto !important;
      }
    `,
  });
}

async function waitForVideoPlayback(videoLocator) {
  await videoLocator.waitFor();
  await videoLocator.evaluate((element) => {
    element.muted = true;
    return element.play().catch(() => undefined);
  });

  await videoLocator.page().waitForFunction(
    () => {
      const video = document.querySelector('video.background-media');
      return Boolean(video && !video.paused && video.currentTime > 0.1);
    },
    undefined,
    { timeout: 10000 },
  );
}

async function main() {
  if (!fs.existsSync(extensionPath)) {
    throw new Error(`Missing build output: ${extensionPath}. Run "pnpm run build" first.`);
  }

  const imageMagick = findImageMagickBinary();
  const framePaths = [];
  let server;
  let extension;

  const capture = async (page, name, hold = 2) => {
    await page.waitForTimeout(180);
    const framePath = path.join(frameRoot, `${String(framePaths.length).padStart(2, '0')}-${name}.png`);
    await page.screenshot({ path: framePath, fullPage: false });
    for (let i = 0; i < hold; i += 1) {
      framePaths.push(framePath);
    }
  };

  try {
    server = await startStaticServer();
    extension = await launchExtension();

    const popupPage = await openExtensionPage(extension.context, extension.extensionId, 'popup');
    await popupPage.waitForLoadState('domcontentloaded');
    await popupPage.locator('.popup-shell').waitFor();
    await disableMotion(popupPage);
    await capture(popupPage, 'popup-initial', 4);

    await popupPage.locator('.toggle-grid .toggle-card').nth(1).click();
    await popupPage.locator('#bookmarksJson').waitFor();
    await capture(popupPage, 'popup-json-mode', 3);

    await popupPage.locator('#bookmarksJson').fill(directJsonBookmarks);

    await popupPage.locator('[role="tab"][data-tab="backgrounds"]').click();
    await popupPage.locator('#backgroundMediaUrls').waitFor();
    await popupPage.locator('#backgroundMediaUrls').fill(`${imageBackgroundUrl}\n${videoBackgroundUrl}`);

    await popupPage.locator('[role="tab"][data-tab="search"]').click();
    await popupPage.locator('#defaultSearchProvider').waitFor();
    await popupPage.locator('#defaultSearchProvider').selectOption('google');
    await capture(popupPage, 'popup-filled', 4);

    await popupPage.locator('.default-provider-row .secondary-button').click();
    await popupPage.locator('#saveConfigButton').click();
    await popupPage.locator('.status-message.success').waitFor();
    await capture(popupPage, 'popup-saved', 3);

    const newTabPage = await openExtensionPage(extension.context, extension.extensionId, 'newtab');
    await newTabPage.waitForLoadState('domcontentloaded');
    await newTabPage.locator('.search-box').waitFor();
    await disableMotion(newTabPage);
    await newTabPage.waitForFunction(
      (expectedSrc) => {
        const image = document.querySelector('img.background-media');
        return Boolean(image?.getAttribute('src')?.includes(expectedSrc));
      },
      'variant=1',
    );
    await newTabPage.locator('.shortcut-label').filter({ hasText: 'Docs' }).waitFor();
    await capture(newTabPage, 'newtab-initial', 5);

    await newTabPage.locator('.search-provider-icon').click();
    await newTabPage.locator('.provider-popover').waitFor();
    await capture(newTabPage, 'provider-menu', 3);

    await newTabPage.locator('.provider-popover-item[data-provider-id="metaso"]').click();
    await newTabPage.locator('.search-provider-name').filter({ hasText: 'Metaso' }).waitFor();
    await capture(newTabPage, 'provider-switched', 3);

    const searchInput = newTabPage.locator('.search-input');
    await searchInput.fill('agentic browser workspace');
    await capture(newTabPage, 'search-typed', 3);

    await newTabPage.locator('.windmill-button').click();
    const video = newTabPage.locator('video.background-media');
    await newTabPage.waitForFunction(
      (expectedSrc) => {
        const element = document.querySelector('video.background-media');
        return Boolean(element?.getAttribute('src')?.includes(expectedSrc));
      },
      'flower.mp4',
    );
    await waitForVideoPlayback(video);
    await capture(newTabPage, 'background-switched-video', 6);
  } finally {
    if (extension) {
      await extension.cleanup();
    }
    if (server) {
      server.kill('SIGTERM');
    }
  }

  execFileSync(imageMagick, [
    '-delay', frameDelay,
    '-loop', '0',
    ...framePaths,
    '-resize', '1100x',
    '-dither', 'FloydSteinberg',
    '-colors', '160',
    '-layers', 'Optimize',
    outputPath,
  ], { stdio: 'inherit' });

  const stats = fs.statSync(outputPath);
  console.log(`Wrote ${outputPath}`);
  console.log(`Frames: ${framePaths.length}`);
  console.log(`Size: ${(stats.size / (1024 * 1024)).toFixed(2)} MiB`);
  console.log(`Temporary frames: ${frameRoot}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
