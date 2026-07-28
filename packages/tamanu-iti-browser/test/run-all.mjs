import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateCerts } from './gen-certs.mjs';
import { startMockFacility } from './mock-facility.mjs';
import { connectFacility } from '../src/agent.mjs';
import { candidates } from '../src/discovery.mjs';
import { facilityOrigin } from '../src/origin.mjs';
import { launchChrome, pageTargetWs, CDP, sleep, findBrowser } from './cdp.mjs';

const results = [];
const record = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`);
};
async function expectThrows(name, fn, detail = '') {
  try {
    await fn();
    record(name, false, 'expected rejection but connection succeeded');
  } catch (err) {
    record(name, true, detail || err.message);
  }
}

async function pollForValue(cdp, expression, wanted, timeoutMs = 8000) {
  const deadline = Date.now() + timeoutMs;
  let last;
  while (Date.now() < deadline) {
    last = await cdp.evaluate(expression);
    if (last === wanted) return last;
    await sleep(150);
  }
  return last;
}

const here = path.dirname(fileURLToPath(import.meta.url));
const tmp = path.join(here, '..', '.tmp');
fs.rmSync(tmp, { recursive: true, force: true });
fs.mkdirSync(tmp, { recursive: true });

const facilities = [];
let goodConn;
let chrome;

try {
  const certs = generateCerts(path.join(tmp, 'certs'));

  // ---- Trust: accept the correctly-signed facility -----------------------
  const good = await startMockFacility(certs.good);
  facilities.push(good);
  goodConn = await connectFacility({
    facilityId: certs.facilityId,
    host: certs.host,
    caPem: certs.besCaPem,
    candidates: candidates({ explicit: [{ address: '127.0.0.1', port: good.port }] }),
  });
  record(
    'trust: BES-signed cert with correct SAN is accepted',
    goodConn.origin === facilityOrigin(certs.facilityId, goodConn.proxyPort),
    goodConn.origin,
  );

  // ---- HTTP proxy pass-through ------------------------------------------
  const health = await (await globalThis.fetch(`http://127.0.0.1:${goodConn.proxyPort}/health`)).text();
  record('proxy: HTTP request forwarded to facility', health === 'ok', `/health -> "${health}"`);

  // ---- WebSocket proxy pass-through (Node client) -----------------------
  const wsEcho = await new Promise(resolve => {
    const ws = new globalThis.WebSocket(`ws://127.0.0.1:${goodConn.proxyPort}/ws`);
    const timer = setTimeout(() => resolve('timeout'), 5000);
    ws.addEventListener('open', () => ws.send('ping'));
    ws.addEventListener('message', ev => {
      clearTimeout(timer);
      resolve(ev.data);
      ws.close();
    });
    ws.addEventListener('error', () => {
      clearTimeout(timer);
      resolve('error');
    });
  });
  record('proxy: WebSocket upgrade forwarded and echoed', wsEcho === 'ping', `echo -> "${wsEcho}"`);

  // ---- Trust: reject wrong issuer and wrong SAN --------------------------
  const badCa = await startMockFacility(certs.badCa);
  facilities.push(badCa);
  await expectThrows(
    'trust: cert from a non-BES (public/rogue) CA is rejected',
    () =>
      connectFacility({
        facilityId: certs.facilityId,
        host: certs.host,
        caPem: certs.besCaPem,
        candidates: candidates({ explicit: [{ address: '127.0.0.1', port: badCa.port }] }),
      }),
  );

  const badSan = await startMockFacility(certs.badSan);
  facilities.push(badSan);
  await expectThrows(
    'trust: BES-signed cert with wrong SAN is rejected',
    () =>
      connectFacility({
        facilityId: certs.facilityId,
        host: certs.host,
        caPem: certs.besCaPem,
        candidates: candidates({ explicit: [{ address: '127.0.0.1', port: badSan.port }] }),
      }),
  );

  // ---- Browser checks: secure context, storage, *.localhost, in-page WS --
  // These need a local Chrome/Chromium; skip cleanly where none is installed
  // (e.g. CI). The trust + proxy checks above have no such requirement.
  if (!findBrowser()) {
    console.log('SKIP  browser checks — no Chrome/Chromium found (set CHROME_PATH to run them)');
  } else {
    const profile = path.join(tmp, 'profile');
    const origin = facilityOrigin(certs.facilityId, goodConn.proxyPort); // http://<uuid>.localhost:PORT

    chrome = await launchChrome({ url: origin, userDataDir: profile });
    let cdp = new CDP(await pageTargetWs(chrome.cdpPort));
    await cdp.open();

    const visits1 = await pollForValue(cdp, '(window.__probe && window.__probe.visits) || 0', 1);
    const loaded = visits1 === 1;
    record('browser: page loads via http://<uuid>.localhost (resolves to loopback)', loaded, `visits=${visits1}`);

    if (loaded) {
      const secure = await cdp.evaluate('window.__probe.secureContext === true');
      record('browser: http://<uuid>.localhost is a secure context', secure === true, `isSecureContext=${secure}`);

      const subtle = await cdp.evaluate('window.__probe.hasSubtleCrypto === true');
      record('browser: secure-context API (crypto.subtle) available', subtle === true, `hasSubtleCrypto=${subtle}`);

      const wsBrowser = await pollForValue(cdp, 'window.__probe.ws', 'ping');
      record('browser: in-page WebSocket echoes through the proxy', wsBrowser === 'ping', `ws=${wsBrowser}`);

      // storage persistence across a reload (same session)
      await cdp.send('Page.reload', {});
      const visits2 = await pollForValue(cdp, '(window.__probe && window.__probe.visits) || 0', 2);
      record('browser: localStorage persists across reload', visits2 === 2, `visits=${visits2}`);

      // storage persistence across a full restart (new Chrome process, same profile + origin)
      cdp.close();
      await chrome.kill();
      await sleep(500); // let the filesystem settle after shutdown
      chrome = await launchChrome({ url: origin, userDataDir: profile });
      cdp = new CDP(await pageTargetWs(chrome.cdpPort));
      await cdp.open();
      const visits3 = await pollForValue(cdp, '(window.__probe && window.__probe.visits) || 0', 3);
      record('browser: localStorage (login state) persists across a restart', visits3 === 3, `visits=${visits3}`);
    } else {
      record('browser: *.localhost resolution', false, 'page did not load — would fall back to 127.0.0.1 + per-facility port');
    }

    // comparison: 127.0.0.1 loopback secure context (the fallback origin)
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${goodConn.proxyPort}/` });
    const secure127 = await pollForValue(cdp, 'window.__probe && window.__probe.secureContext', true);
    record('browser: http://127.0.0.1 is a secure context (fallback origin)', secure127 === true, `isSecureContext=${secure127}`);

    cdp.close();
  }
} finally {
  if (chrome) await chrome.kill().catch(() => {});
  if (goodConn) await goodConn.close().catch(() => {});
  for (const f of facilities) await f.close().catch(() => {});
  fs.rmSync(tmp, { recursive: true, force: true });
}

const failed = results.filter(r => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
