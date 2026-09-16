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
 *   FACILITY_FRONTEND_URL, TEST_EMAIL, TEST_PASSWORD set, pointing at any running
 *   Tamanu the shots should be taken against.
 *
 * Usage:
 *   node scripts/capture-user-manual-screenshot.mjs \
 *     --path /patients/all \
 *     --out docs/user-manuals/desktop/patients/images/find-a-patient-list.png
 *
 * Options:
 *   --path <route>        route to capture, relative to the frontend (default /dashboard)
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
import { mkdir } from 'fs/promises';
import { dirname, resolve } from 'path';

function parseArgs(argv) {
  const options = { click: [], viewport: '1440x900', path: '/dashboard' };
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

const baseUrl =
  options.baseUrl ??
  (options.admin
    ? process.env.ADMIN_FRONTEND_URL ?? 'http://localhost:5174'
    : process.env.FACILITY_FRONTEND_URL ?? 'http://localhost:5173');

const email = process.env.TEST_EMAIL;
const password = process.env.TEST_PASSWORD;
if (!email || !password) fail('TEST_EMAIL and TEST_PASSWORD must be set');

const [width, height] = options.viewport.split('x').map(Number);
if (!width || !height) fail(`--viewport must look like 1440x900, got "${options.viewport}"`);

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
  await page.getByTestId('loginbutton-gx21').waitFor({ state: 'detached', timeout: 60_000 });

  const target = new URL(options.path, baseUrl).toString();
  if (!page.url().startsWith(target)) {
    await page.goto(target, { waitUntil: 'domcontentloaded' });
  }

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
