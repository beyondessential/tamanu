/**
 * Captures one screenshot for an end user manual guide.
 *
 * Deliberately one shot per invocation: guides are written a step at a time, and the
 * person writing needs to see each shot before deciding the next. Run it repeatedly
 * rather than expecting it to regenerate a whole guide.
 *
 * It reuses the e2e suite's environment variables and login selectors, so a machine
 * already set up to run Playwright tests needs no further configuration.
 *
 * Prerequisites:
 *   npx playwright install chromium        (browsers are not installed by npm install)
 *   FACILITY_FRONTEND_URL, TEST_EMAIL, and TEST_PASSWORD, pointing at any running Tamanu
 *   the shots should be taken against. These are read from packages/e2e-tests/.env when
 *   it exists, so an existing e2e setup needs no further configuration; values exported
 *   in the shell override that file.
 *
 * Usage:
 *   node scripts/capture-user-manual-screenshot.mjs \
 *     --path /patients/all \
 *     --out docs/user-manuals/desktop/patients/images/find-a-patient-list.png
 *
 * Options:
 *   --path <route>        route to capture, appended to the frontend URL. Defaults to
 *                         /dashboard, or / with --admin
 *   --out <file>          where to write the PNG (required)
 *   --base-url <url>      overrides FACILITY_FRONTEND_URL
 *   --admin               capture the admin frontend instead of the facility one
 *   --click <selector>    click this before capturing; repeatable, applied in order
 *   --wait-for <selector> wait for this to be visible before capturing
 *   --viewport <WxH>      browser size (default 1440x900)
 *   --full-page           capture the whole scrollable page rather than the viewport
 *   --clip <selector>     capture only this element rather than the page
 *
 * Screenshots are published, so point this at demo or test data. Never capture a
 * screen showing real patient information.
 */
import { existsSync } from 'fs';
import { mkdir } from 'fs/promises';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const E2E_ENV_FILE = join(dirname(fileURLToPath(import.meta.url)), '..', 'packages', 'e2e-tests', '.env');

/**
 * The e2e suite keeps its credentials and frontend URLs in packages/e2e-tests/.env, which
 * Playwright loads through its own config rather than exporting to the shell. Read the same
 * file so a machine already set up to run those tests needs nothing further, while anything
 * exported in the shell still wins.
 */
function loadE2eEnv() {
  if (!existsSync(E2E_ENV_FILE)) return;
  const keys = ['FACILITY_FRONTEND_URL', 'ADMIN_FRONTEND_URL', 'TEST_EMAIL', 'TEST_PASSWORD'];
  const fromShell = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  try {
    process.loadEnvFile(E2E_ENV_FILE);
  } catch {
    return; // unreadable or malformed; the shell environment is still authoritative
  }
  // loadEnvFile already leaves existing variables alone; restoring them makes that
  // guarantee explicit here rather than depending on it.
  for (const [key, value] of Object.entries(fromShell)) {
    if (value !== undefined) process.env[key] = value;
  }
}

function parseArgs(argv) {
  const options = { click: [], viewport: '1440x900' };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = () => {
      const value = argv[++i];
      if (value === undefined) throw new Error(`${arg} needs a value`);
      return value;
    };
    switch (arg) {
      case '--path': options.path = next(); break;
      case '--out': options.out = next(); break;
      case '--base-url': options.baseUrl = next(); break;
      case '--admin': options.admin = true; break;
      case '--click': options.click.push(next()); break;
      case '--wait-for': options.waitFor = next(); break;
      case '--viewport': options.viewport = next(); break;
      case '--full-page': options.fullPage = true; break;
      case '--clip': options.clip = next(); break;
      default: throw new Error(`Unknown option: ${arg}`);
    }
  }
  return options;
}

function fail(message) {
  console.error(`capture-user-manual-screenshot: ${message}`);
  process.exit(1);
}

const options = parseArgs(process.argv.slice(2));

if (!options.out) fail('--out is required (the PNG path to write)');
if (!options.out.endsWith('.png')) fail('--out must end in .png');

loadE2eEnv();

const baseUrl =
  options.baseUrl ??
  (options.admin
    ? process.env.ADMIN_FRONTEND_URL ?? 'http://localhost:5174'
    : process.env.FACILITY_FRONTEND_URL ?? 'http://localhost:5173');

const email = process.env.TEST_EMAIL;
const password = process.env.TEST_PASSWORD;
if (!email || !password) {
  fail(
    'TEST_EMAIL and TEST_PASSWORD must be set, either in the environment or in ' +
      'packages/e2e-tests/.env (see its .env.example).',
  );
}

const [width, height] = options.viewport.split('x').map(Number);
if (!width || !height) fail(`--viewport must look like 1440x900, got "${options.viewport}"`);

// /dashboard is a facility route; the admin frontend has no such page, so its default
// is its own root.
const routePath = options.path ?? (options.admin ? '/' : '/dashboard');
if (!routePath.startsWith('/')) fail(`--path must start with "/", got "${routePath}"`);

// Imported only once the arguments are known good, so a typo reports itself plainly
// instead of surfacing a module-resolution stack trace.
let chromium;
try {
  ({ chromium } = await import('@playwright/test'));
} catch {
  fail('Playwright is not available. Run `npm install`, then `npx playwright install chromium`.');
}

const browser = await chromium.launch();
// en-AU matches what the e2e suite pins, so dates in screenshots read the way a
// reader in the region sees them.
const context = await browser.newContext({
  viewport: { width, height },
  locale: 'en-AU',
  deviceScaleFactor: 2, // readable when scaled down in a rendered page
});
const page = await context.newPage();

try {
  // Log in. These selectors mirror packages/e2e-tests/pages/LoginPage.ts; if the login
  // screen changes, that page object is the place to look.
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByTestId('loginbutton-gx21').click();

  // Wait for the authenticated shell, not merely for the login form to go away. The
  // log-out button lives in the sidebar, which renders only past the facility check
  // (packages/web/app/App.jsx returns the facility picker before it). Waiting for the
  // login button to detach would also be satisfied by the facility-selection screen,
  // and every shot after that would silently be of the wrong page.
  try {
    await page.getByTestId('logoutbutton-4zn4').waitFor({ state: 'visible', timeout: 60_000 });
  } catch {
    throw new Error(
      'Signed in but never reached the app. Tamanu may be waiting on the facility-selection ' +
        'screen, which happens when the account has more than one facility available.',
    );
  }

  // Concatenated rather than resolved through `new URL`, which would discard any path
  // prefix on the base URL: new URL('/dashboard', 'https://host/tamanu') drops /tamanu.
  // This matches constructFacilityUrl in the e2e suite.
  const target = `${baseUrl.replace(/\/+$/, '')}${routePath}`;
  await page.goto(target, { waitUntil: 'domcontentloaded' });

  for (const selector of options.click) {
    await page.locator(selector).click();
  }
  if (options.waitFor) {
    await page.locator(options.waitFor).waitFor({ state: 'visible', timeout: 30_000 });
  }

  // Let layout and any entry animation settle, so shots of the same screen match.
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(500);

  const out = resolve(options.out);
  await mkdir(dirname(out), { recursive: true });

  if (options.clip) {
    await page.locator(options.clip).screenshot({ path: out });
  } else {
    await page.screenshot({ path: out, fullPage: Boolean(options.fullPage) });
  }

  console.log(`Wrote ${options.out}`);
  console.log('Check it shows no real patient information before committing it.');
} catch (error) {
  fail(`${error.message}\n\nThe app must be running and reachable at ${baseUrl}.`);
} finally {
  await browser.close();
}
