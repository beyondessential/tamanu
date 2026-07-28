import { spawn } from 'node:child_process';
import fs from 'node:fs';

/**
 * Launch the user's *already installed* Chrome at the loopback origin, in
 * app mode (no address bar) with a persistent, per-facility user-data-dir so
 * web storage and login survive restarts. No Chromium is bundled — renderer
 * security stays delegated to the browser vendor.
 */
const CHROME_CANDIDATES = {
  linux: [
    process.env.CHROME_PATH,
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ],
  darwin: [
    process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
  ],
  win32: [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  ],
};

export function findChrome(platform = process.platform) {
  const candidates = (CHROME_CANDIDATES[platform] ?? []).filter(Boolean);
  return candidates.find(p => {
    try {
      fs.accessSync(p, fs.constants.X_OK);
      return true;
    } catch {
      return false;
    }
  });
}

export function launchApp(url, { userDataDir, chromePath = findChrome(), extraArgs = [] } = {}) {
  if (!chromePath) throw new Error('Chrome not found — install Chrome/Chromium or set CHROME_PATH');
  const args = [`--app=${url}`, `--user-data-dir=${userDataDir}`, ...extraArgs];
  const proc = spawn(chromePath, args, { stdio: 'ignore', detached: true });
  proc.unref();
  return proc;
}
