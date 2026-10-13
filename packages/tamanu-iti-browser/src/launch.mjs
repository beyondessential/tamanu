import { spawn } from 'node:child_process';
import { resolveBrowser, browserCommand } from './browser.mjs';

/**
 * Launch the user's *already installed* Chrome at the loopback origin, in app
 * mode (no address bar) with a persistent, per-facility user-data-dir so web
 * storage and login survive restarts. No Chromium is bundled — renderer
 * security stays delegated to the browser vendor. Handles both plain binaries
 * and Flatpak installs (see browser.mjs).
 */
export function launchApp(url, { userDataDir, extraArgs = [] } = {}) {
  const browser = resolveBrowser();
  if (!browser) throw new Error('Chrome/Chromium not found — install Chrome or set CHROME_PATH');
  const args = [`--app=${url}`, `--user-data-dir=${userDataDir}`, ...extraArgs];
  const [command, argv] = browserCommand(browser, { args, userDataDir });
  const proc = spawn(command, argv, { stdio: 'ignore', detached: true });
  proc.unref();
  return proc;
}
