# Tamanu Iti Browser — prototype

Design: [`llm/docs/tamanu-iti-browser.md`](../../llm/docs/tamanu-iti-browser.md).

This is a **prototype / validation spike**, not the shipping client. It exists to
prove the riskiest part of the design — the **desktop headless-helper model** —
with real code before committing to it:

- a **headless agent** that connects to a facility server over TLS, trusting
  **only the BES CA** and checking the certificate **SAN** — the trust decision
  made in ordinary TLS-client code, with no browser hook;
- a **loopback reverse proxy** that exposes the verified connection to a browser
  as `http://<facility-id>.localhost:<port>` (HTTP + WebSocket);
- launching the user's **real, installed Chrome** at that origin in app mode
  (`src/launch.mjs`), so no Chromium is bundled and renderer security stays with
  the browser vendor.

It is deliberately **dependency-free** (Node built-ins only), so it runs with no
`npm install`. It needs **Node ≥ 22** (it uses the global `WebSocket` client,
stable from Node 22). The trust and proxy checks run anywhere; the browser
checks additionally need a Chrome/Chromium and are **skipped** if none is found
(set `CHROME_PATH` to point at one).

## What it validates

`node test/run-all.mjs` stands up a mock facility (self-signed via a test BES CA
built with the system `openssl`), runs the agent against it, and drives a real
headless Chromium over the DevTools Protocol. It checks the claims the whole
design rests on:

| Check | Design claim proven |
|-------|---------------------|
| BES-signed cert with correct SAN is accepted | pinned trust works |
| Cert from a non-BES (public/rogue) CA is rejected | public certs can't impersonate the facility |
| BES-signed cert with wrong SAN is rejected | identity is enforced, not just issuer |
| HTTP request forwarded to facility | loopback proxy carries ordinary requests |
| WebSocket upgrade forwarded and echoed | proxy carries WebSockets/streaming |
| Page loads via `http://<uuid>.localhost` | `*.localhost` resolves to loopback in Chrome |
| `http://<uuid>.localhost` is a secure context | gated web APIs will work — **the key open question** |
| `crypto.subtle` available | secure-context APIs present |
| In-page WebSocket echoes through the proxy | real browser WS through the proxy |
| localStorage persists across reload | per-origin storage works |
| localStorage persists across a **restart** | login/session survives restarts (kiosk + "remember me") |
| `http://127.0.0.1` is a secure context | the documented fallback origin also works |

All 12 pass in this environment (Chromium 141, Node 22), so `http://<uuid>.localhost`
is confirmed to be both loopback-resolving and a secure context — the assumption
the preferred rendering model depends on.

## Running

```bash
npm run validate               # from packages/tamanu-iti-browser (= node test/run-all.mjs)
# or, against a specific browser binary:
CHROME_PATH=/path/to/chrome npm run validate
```

Real end-to-end launch on a desktop (opens an actual Chrome window):

```bash
node src/cli.mjs --facility <uuid> --host <uuid>.facility.internal \
  --ca /path/to/bes-ca.pem --candidate <ip>:<port>
```

## Caveats / what this does NOT cover

- **Headless CDP stands in for a real desktop window.** It exercises the same
  Chromium engine and the same origin/secure-context/storage behaviour, but not
  the `--app` windowing, install, or auto-start UX — those need a real desktop.
- **Discovery is stubbed to the user-entry source only** (`src/discovery.mjs`).
  mDNS, custom multicast, the Canopy candidate list, and the cache are designed
  but not built here.
- **Server-side is mocked.** The real BES CA, ACME-style renewal, and Caddy
  serving are out of scope (in progress separately).
- **No Android.** This spike is the desktop model; the Android WebView path is
  separate.
- **Prototype code.** Plain ESM JavaScript for zero-install runnability; the real
  package would be the TypeScript core described in the design, and would be
  wired into the workspace + CI (kept out for now so it doesn't drag Chromium
  into the monorepo test sweep).
