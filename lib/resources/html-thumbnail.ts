import "server-only";
import { existsSync } from "node:fs";

// 16:9 to match the pedagogic card's `aspect-video` cover.
const VIEWPORT = { width: 1200, height: 675 } as const;
const LOAD_TIMEOUT_MS = 15_000;
// Grace period after load so script-rendered content (games draw their first
// frame from JS) makes it into the capture.
const SETTLE_MS = 500;

// Fallbacks when CHROMIUM_EXECUTABLE_PATH is not set, most specific first.
const EXECUTABLE_CANDIDATES: Partial<Record<NodeJS.Platform, string[]>> = {
  linux: [
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
  ],
  win32: [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ],
  darwin: [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
  ],
};

function findChromiumExecutable(): string | null {
  const fromEnv = process.env.CHROMIUM_EXECUTABLE_PATH;
  if (fromEnv) return existsSync(fromEnv) ? fromEnv : null;
  return EXECUTABLE_CANDIDATES[process.platform]?.find((path) => existsSync(path)) ?? null;
}

/**
 * Renders a standalone HTML file (interactive pedagogic material) to a PNG
 * buffer for use as a cover thumbnail — the HTML counterpart of
 * `renderPdfThumbnail`. HTML needs a real browser engine to render, so this
 * drives a system-installed Chromium/Chrome headlessly; set
 * CHROMIUM_EXECUTABLE_PATH to point at the binary. Returns null when no
 * browser is available or rendering fails — a resource without a thumbnail is
 * preferable to a failed upload.
 */
export async function renderHtmlThumbnail(html: string): Promise<Buffer | null> {
  const executablePath = findChromiumExecutable();
  if (!executablePath) {
    console.warn(
      "[resources] no Chromium executable found (set CHROMIUM_EXECUTABLE_PATH); skipping HTML thumbnail",
    );
    return null;
  }

  let browser: Awaited<ReturnType<typeof import("puppeteer-core").launch>> | undefined;
  try {
    const { launch } = await import("puppeteer-core");
    browser = await launch({
      executablePath,
      // The content is admin-uploaded (trusted) and the process is short-lived;
      // --no-sandbox keeps this working under PM2 on Ubuntu, where unprivileged
      // user namespaces are restricted and the Chromium sandbox cannot start.
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--hide-scrollbars"],
    });
    const page = await browser.newPage();
    await page.setViewport(VIEWPORT);
    try {
      await page.setContent(html, { waitUntil: "load", timeout: LOAD_TIMEOUT_MS });
    } catch {
      // A page stuck loading a hung sub-resource never fires `load` —
      // capture whatever rendered.
    }
    await new Promise((resolve) => setTimeout(resolve, SETTLE_MS));
    const screenshot = await page.screenshot({ type: "png" });
    return Buffer.from(screenshot);
  } catch (error) {
    console.error("[resources] failed to render HTML thumbnail", error);
    return null;
  } finally {
    await browser?.close().catch(() => undefined);
  }
}
