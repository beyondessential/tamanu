import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// Minimal Chrome DevTools Protocol driver over Node's global WebSocket — no
// Playwright/puppeteer dependency. Enough to launch headless Chrome, attach to
// the page target, and evaluate expressions.

export const sleep = ms => new Promise(r => setTimeout(r, ms));

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

function fromPlaywright() {
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  try {
    for (const dir of fs.readdirSync(base)) {
      if (!dir.startsWith('chromium-')) continue;
      for (const rel of ['chrome-linux/chrome', 'chrome-mac/Chromium.app/Contents/MacOS/Chromium', 'chrome-win/chrome.exe']) {
        const candidate = path.join(base, dir, rel);
        if (fs.existsSync(candidate)) return candidate;
      }
    }
  } catch {
    /* no playwright browsers dir */
  }
  return null;
}

function fromPath() {
  if (process.platform === 'win32') return null;
  for (const name of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'chrome']) {
    try {
      const found = execFileSync('command', ['-v', name], { shell: '/bin/sh', encoding: 'utf8' }).trim();
      if (found) return found;
    } catch {
      /* not on PATH */
    }
  }
  return null;
}

/**
 * Resolve a Chrome/Chromium binary, or null if none is available.
 * Order: CHROME_PATH, well-known install paths, PATH, Playwright's managed copy.
 */
export function findBrowser() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  for (const candidate of ABSOLUTE_CANDIDATES) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return fromPath() || fromPlaywright();
}

async function waitForFile(file, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const line = fs.readFileSync(file, 'utf8').split('\n')[0].trim();
      if (line) return Number(line);
    } catch {
      /* not yet */
    }
    await sleep(100);
  }
  throw new Error(`timed out waiting for ${file}`);
}

export async function launchChrome({ url, userDataDir }) {
  const browser = findBrowser();
  if (!browser) throw new Error('no Chrome/Chromium found — set CHROME_PATH');
  fs.mkdirSync(userDataDir, { recursive: true });
  // Reusing a profile dir (restart test) leaves stale control files behind; a
  // SIGKILLed Chrome does not clean them up. Remove them so we wait for the new
  // process's DevTools port rather than reading the dead one.
  for (const f of ['DevToolsActivePort', 'SingletonLock', 'SingletonSocket', 'SingletonCookie']) {
    try {
      fs.rmSync(path.join(userDataDir, f), { force: true });
    } catch {
      /* ignore */
    }
  }
  const proc = spawn(
    browser,
    [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--remote-debugging-port=0',
      `--user-data-dir=${userDataDir}`,
      '--no-first-run',
      '--no-default-browser-check',
      url,
    ],
    { stdio: 'ignore' },
  );
  const cdpPort = await waitForFile(path.join(userDataDir, 'DevToolsActivePort'));
  // Graceful stop so Chrome flushes storage (leveldb) to disk, as a real
  // restart would; SIGKILL only as a fallback if it hangs.
  const kill = () =>
    new Promise(resolve => {
      proc.once('exit', resolve);
      proc.kill('SIGTERM');
      setTimeout(() => {
        try {
          proc.kill('SIGKILL');
        } catch {
          /* already gone */
        }
      }, 4000);
    });
  return { proc, cdpPort, kill };
}

export async function pageTargetWs(cdpPort, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const list = await (await globalThis.fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json();
      const page = list.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
      if (page) return page.webSocketDebuggerUrl;
    } catch {
      /* not ready */
    }
    await sleep(100);
  }
  throw new Error('no page target appeared');
}

export class CDP {
  constructor(wsUrl) {
    this.ws = new globalThis.WebSocket(wsUrl);
    this.id = 0;
    this.pending = new Map();
    this.ws.addEventListener('message', ev => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    });
  }

  open() {
    return new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve, { once: true });
      this.ws.addEventListener('error', () => reject(new Error('CDP ws error')), { once: true });
    });
  }

  send(method, params = {}) {
    const id = (this.id += 1);
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }

  async evaluate(expression) {
    const r = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
    return r.result.value;
  }

  close() {
    try {
      this.ws.close();
    } catch {
      /* ignore */
    }
  }
}
