// Ready-to-run headless harness for the verify-regression-fixes skill.
// CommonJS (.cjs) on purpose: the Tamanu repo is "type": "module", so a .js here would be ESM.
//
// Prereqs (every run):
//   export PATH="$HOME/.nvm/versions/node/<version-from-.node-version>/bin:$PATH"
//   export NODE_PATH="<tamanu-repo>/node_modules"   # so require('playwright') resolves
//   (Playwright + a chromium build already ship in the repo's node_modules / cache.)
//
// 1) Log in once (saves storageState to $QA_OUT/auth.json, default ./qa-out/auth.json):
//      node harness.cjs login --base=https://facility-1.release-2-67-rc.cd.tamanu.app \
//                             --email=admin@tamanu.io --password=admin
//    Repeat for the central app with its --base (use a different QA_OUT per app).
//
// 2) Per-issue scripts reuse the session (keep them OUTSIDE the repo, e.g. in /tmp, so they're CJS):
//      const { openAuthed, shot } = require('<repo>/.agents/skills/verify-regression-fixes/harness.cjs');
//      (async () => {
//        const { browser, page } = await openAuthed('https://facility-1.release-2-67-rc.cd.tamanu.app');
//        await page.goto('.../lab-requests/all', { waitUntil: 'domcontentloaded' });
//        await page.waitForTimeout(3000);
//        await shot(page, 't36-active');     // then READ the png to judge
//        await browser.close();
//      })();
//
// Judge results by READING the screenshots — MUI dropdown/option text is unreliable via selectors.

/* global process, console */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const OUT = process.env.QA_OUT || path.join(process.cwd(), 'qa-out');
const AUTH = path.join(OUT, 'auth.json');

// Lazy so `node harness.cjs` (usage) works even without NODE_PATH set.
const pw = () => require('playwright');

// Tamanu's browser-support gate blocks headless/old UAs ("Tamanu is not available on your browser").
// Spoof the *current* installed Chrome major (the gate floors at current-minus-versionsBack).
function currentChromeUA() {
  let major = 156; // fallback — bump if detection fails and the gate still blocks
  try {
    const out = execSync(
      `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --version 2>/dev/null ` +
        `|| google-chrome --version 2>/dev/null || google-chrome-stable --version 2>/dev/null || true`,
      { encoding: 'utf8' },
    );
    const m = /(\d+)\./.exec(out);
    if (m) major = Number(m[1]);
  } catch {
    /* keep fallback */
  }
  return `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${major}.0.0.0 Safari/537.36`;
}

const UA = currentChromeUA();

function makeContext(browser, storageState) {
  return browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: UA,
    ...(storageState ? { storageState } : {}),
  });
}

async function login(base, email, password) {
  if (!base || !email || !password) throw new Error('need --base, --email, --password');
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await pw().chromium.launch({ headless: true });
  const ctx = await makeContext(browser);
  const page = await ctx.newPage();
  await page.goto(`${base}/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.getByRole('button', { name: /^log in$/i }).click();
  await page.waitForTimeout(9000);
  const url = page.url();
  const txt = (await page.locator('body').innerText().catch(() => '')).slice(0, 200);
  if (url.includes('/login') || /invalid|incorrect|not available on your browser/i.test(txt)) {
    await page.screenshot({ path: path.join(OUT, 'login-failed.png') });
    throw new Error(`login failed (at ${url}) — see ${OUT}/login-failed.png`);
  }
  await ctx.storageState({ path: AUTH });
  console.log(`login ok -> ${AUTH}\nUA: ${UA}`);
  await browser.close();
}

// Open an authenticated page reusing the saved session. Pass a base URL to land on its dashboard.
async function openAuthed(base) {
  if (!fs.existsSync(AUTH)) {
    throw new Error(`no session at ${AUTH} — run: node harness.cjs login --base=<url> --email=.. --password=..`);
  }
  const browser = await pw().chromium.launch({ headless: true });
  const ctx = await makeContext(browser, AUTH);
  const page = await ctx.newPage();
  if (base) {
    await page.goto(`${base}/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2500);
  }
  return { browser, ctx, page };
}

// Screenshot -> returns the path; READ it with your Read tool to decide PASS/FAIL.
async function shot(page, name) {
  fs.mkdirSync(OUT, { recursive: true });
  const p = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: p });
  console.log('shot:', p);
  return p;
}

module.exports = { openAuthed, login, shot, makeContext, UA, OUT, AUTH };

if (require.main === module) {
  const arg = k => {
    const hit = process.argv.find(a => a.startsWith(`--${k}=`));
    return hit ? hit.slice(k.length + 3) : undefined;
  };
  if (process.argv[2] === 'login') {
    login(arg('base'), arg('email'), arg('password')).catch(e => {
      console.error('ERR', e.message);
      process.exit(1);
    });
  } else {
    console.log('usage: node harness.cjs login --base=<url> --email=<email> --password=<password>');
  }
}
