import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// Resolve a Chrome/Chromium install across the ways it ships, and build the
// argv to launch it. Descriptor is { kind: 'binary', path } or
// { kind: 'flatpak', appId }.

const ABSOLUTE_CANDIDATES = [
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/snap/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
];

const FLATPAK_APP_IDS = [
  'com.google.Chrome',
  'org.chromium.Chromium',
  'io.github.ungoogled_software.ungoogled_chromium',
  'com.brave.Browser',
  'com.microsoft.Edge',
];

function fromEnv() {
  const p = process.env.CHROME_PATH;
  return p && fs.existsSync(p) ? { kind: 'binary', path: p } : null;
}

function fromAbsolute() {
  const found = ABSOLUTE_CANDIDATES.find(p => fs.existsSync(p));
  return found ? { kind: 'binary', path: found } : null;
}

function fromPath() {
  if (process.platform === 'win32') return null;
  for (const name of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'chrome']) {
    try {
      const found = execFileSync('command', ['-v', name], { shell: '/bin/sh', encoding: 'utf8' }).trim();
      if (found) return { kind: 'binary', path: found };
    } catch {
      /* not on PATH */
    }
  }
  return null;
}

function fromFlatpak() {
  try {
    execFileSync('flatpak', ['--version'], { stdio: 'ignore' });
  } catch {
    return null; // flatpak not installed
  }
  for (const appId of FLATPAK_APP_IDS) {
    try {
      execFileSync('flatpak', ['info', appId], { stdio: 'ignore' });
      return { kind: 'flatpak', appId };
    } catch {
      /* app not installed */
    }
  }
  return null;
}

function fromPlaywright() {
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  try {
    for (const dir of fs.readdirSync(base)) {
      if (!dir.startsWith('chromium-')) continue;
      for (const rel of ['chrome-linux/chrome', 'chrome-mac/Chromium.app/Contents/MacOS/Chromium', 'chrome-win/chrome.exe']) {
        const candidate = path.join(base, dir, rel);
        if (fs.existsSync(candidate)) return { kind: 'binary', path: candidate };
      }
    }
  } catch {
    /* no playwright browsers dir */
  }
  return null;
}

/**
 * Resolve a browser, or null if none is found. Order: CHROME_PATH, well-known
 * install paths, PATH, Flatpak, then (tests only) Playwright's managed copy.
 */
export function resolveBrowser({ includePlaywright = false } = {}) {
  return (
    fromEnv() ||
    fromAbsolute() ||
    fromPath() ||
    fromFlatpak() ||
    (includePlaywright ? fromPlaywright() : null)
  );
}

/**
 * Build [command, argv] to launch `browser` with `args` (Chrome flags). For a
 * Flatpak browser this wraps in `flatpak run` and grants the profile dir into
 * the sandbox; Flatpak shares the host network namespace, so the loopback
 * proxy stays reachable at 127.0.0.1.
 */
export function browserCommand(browser, { args, userDataDir }) {
  if (browser.kind === 'flatpak') {
    const grants = userDataDir ? [`--filesystem=${userDataDir}`] : [];
    return ['flatpak', ['run', ...grants, browser.appId, ...args]];
  }
  return [browser.path, args];
}
