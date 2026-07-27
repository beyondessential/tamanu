# Facility client shell — design

Status: **design / not yet built**. This document describes the shape of a thin
native client ("the shell") that lets clinical staff reach a facility server on
networks where public DNS and publicly-trusted HTTPS are not available. It is a
design artifact to be reviewed before any package is scaffolded.

## Background

In production, Tamanu is **just a website**: a single HTTPS origin that serves
the facility web app. On normal networks staff reach it over a public name with
a publicly-trusted certificate — DNS resolves, TLS is trusted, secure-context
APIs work, and the site can be installed as a PWA. All a client needs is an
up-to-date Chromium.

The shell treats that website as **opaque**: a URL that serves a website over
HTTPS. It must not depend on how the site is built, bundled, or served (Vite,
Caddy, static vs. dynamic, and so on are all irrelevant to it). From the shell's
perspective there is one thing — an origin — and its job is to reach that origin
and point a browser at it.

Some facilities cannot obtain publicly-trusted certificates and run on ad-hoc
LANs with no static addressing. On those networks:

- Access is over HTTP by IP (or mDNS `.local`, where the network allows it).
- The facility server's IP churns as DHCP leases renew.
- HTTP loses the browser's secure context, so a range of web APIs silently
  break, and traffic is unencrypted on the LAN.
- The installed-PWA experience hides the address bar, so when the IP changes
  the user cannot re-point it and has to fall back to a raw browser.

The server-side answer (a BES-run private CA, per-facility certificates renewed
against Canopy while the server has intermittent internet, served by Caddy) is
**out of scope for this document and already in progress**. What remains, and
what this document covers, is the **client**: a distributable native shell that
discovers the facility server, connects to it over a certificate that chains to
the BES CA, and loads the facility website against a stable, trusted, secure
origin.

## Goals

- Reach a facility server whose address is unknown and changing, with **no
  reliance on public DNS or publicly-trusted certificates**.
- Present the connection as a **secure context** so the website behaves exactly
  as it does on a normal deployment, with no change to Tamanu itself.
- Keep the address churn **invisible** to the user, and preserve web storage
  and session across it.
- Be **installable fully offline** — a single file copied over a LAN or a USB
  stick, no internet required to stand up a new client.
- Stay a **thin, near-static shell**: all product logic remains in the website,
  so the "one website everywhere" model is preserved and the shell rarely needs
  updating.

## Non-goals

- No product UI in the shell. It discovers, establishes a trusted origin, and
  loads the website. Nothing else.
- No coupling to how Tamanu is built or served. The shell targets an origin, not
  a bundle; it works unchanged whatever Tamanu's build looks like.
- No server-side work (CA, ACME-style renewal, Caddy config, Canopy
  registration). Those are separate and already underway.
- iOS is **deferred**. Android tablets are the primary mobile target; desktop
  (Windows/macOS/Linux) is the primary workstation target.

## Trust model (assumed from server-side work)

The shell is built around these properties, which the server side provides:

- A **BES-run CA** (long-lived, e.g. 10 years; ideally an offline root plus a
  signing intermediate) whose anchor is **baked into the shell binary**.
- Each facility server holds a **BES-signed leaf certificate** whose SAN is a
  **stable identity** (e.g. the facility/server UUID as a name under a reserved
  namespace such as `.internal`), **not** an IP. The server keeps that leaf
  comfortably long-lived (target ≥90 days of remaining validity at all times,
  renewed against Canopy while online).

Consequences the shell relies on:

- Trust does **not** require the client to be online — the anchor ships in the
  binary.
- The certificate is bound to a stable name, so **IP churn never invalidates
  it**.
- Verifying "chains to BES CA" **and** "SAN == the facility I asked for" answers
  both *authentic server* and *correct server* cryptographically. This is what
  makes broad, promiscuous discovery safe (below).

## Versioning and compatibility

The shell has its **own version line**, independent of Tamanu's. It may be
released *alongside* Tamanu's artifacts for convenience, but must never be named
or numbered to match a Tamanu version — that would train clients to believe the
shell must be kept in lockstep with the server, when in fact there is broad
compatibility. The aim is that **an old shell keeps working against all Tamanu
versions**, so that we ship the shell approximately once and rarely again.

That guarantee holds only if the shell's contract with the server stays tiny and
stable. The shell's **entire protocol surface** is:

- an HTTPS **origin** that serves a website (opaque — see Background),
- a **BES-signed certificate** whose SAN is the facility identity, and
- a **discovery record** describing where that origin currently lives.

The shell knows nothing of Tamanu's application-level APIs or versions. Keep the
discovery record and any negotiation **add-only** (versioned, with new fields
optional and ignored by older shells), so the protocol never breaks
backwards-compatibility and the server side can evolve freely.

## Renderer and security ownership

The single biggest risk to "ship once, never again" is the **web renderer**.
Chromium ships security fixes every few weeks, often for actively-exploited
zero-days. Whoever bundles the renderer owns that patch treadmill.

A core advantage of the plain-website model is that **browser security is the
vendor's problem, not Tamanu's** — the user's auto-updating Chrome is patched by
Google. The shell must not casually give that up. If it bundled its own Chromium
(e.g. Electron), Tamanu would own renderer security, which on these offline
networks means either running auto-update infrastructure that cannot reliably
reach the clients, or a **frozen, unpatched browser handling patient data**. That
is the worst outcome and it defeats the ship-once goal.

Therefore the design principle is: **the shell should host no renderer of its
own, and keep renderer security delegated to the platform/browser vendor.** This
also keeps the shell tiny and its attack surface small, which is what makes the
"rarely shipped, never on a security clock" goal realistic. Because the primary
path is the plain website and this is a fallback, we should not materially
compromise security to build it.

The runtime options, ranked by how well they preserve delegated patching:

1. **Headless helper + the user's real Chrome (preferred for desktop).** The
   shell is a small headless agent with **no renderer**. It does discovery,
   holds the BES anchor, and runs a **loopback reverse proxy**: its own TLS
   client verifies the facility certificate against the BES CA (pinning as
   ordinary code — no browser trust hook needed), then exposes the connection to
   the browser as `http://<facility-uuid>.localhost:PORT` and launches the
   already-installed Chrome at that URL.
   - `http://*.localhost` is a **secure context** by spec, so every gated web API
     works with no certificate juggling in the browser.
   - The renderer is the user's **real, Google-patched Chrome** — security stays
     delegated.
   - On-the-wire encryption is intact (agent→facility is BES-TLS); only the
     loopback hop is plaintext and never leaves the machine.
   - Chrome's `--app=http://…` flag opens a standalone, address-bar-less window,
     recreating the seamless PWA-like experience.
   - A stable `<uuid>.localhost` origin on a persisted port preserves session and
     web storage across IP churn.
2. **System-webview wrapper (fallback).** A Tauri-style shell over the system
   webview — WebView2 (Chromium, Microsoft-patched) on Windows, WKWebView on
   macOS, WebKitGTK on Linux. Vendor-patched, so ship-once survives, but on
   macOS/Linux the WebKit engine reintroduces the cross-engine drift Tamanu
   escaped by standardising on Chrome. Acceptable fallback, not first choice.
3. **Bundled Chromium (last resort).** Electron and similar. The only option
   that forces Tamanu to own renderer security and so defeats ship-once; avoid
   unless the above cannot be made to work.

**Mobile** is less fraught because the system components are vendor-patched
regardless: Android System WebView is Chromium updated by Google via Play, and
**Chrome Custom Tabs** are the user's Chrome (engine and updates). The
loopback-proxy + Custom-Tab-at-`localhost` pattern may port to Android and keep
patching delegated; that needs validation (Custom Tabs lifecycle, loading
localhost, back-button UX), with system WebView as the safe fallback.

## Architecture overview

The preferred desktop shape — a headless agent that proxies to the user's real
Chrome over loopback (see Renderer and security ownership):

```
                   ┌────────────────────────────────────────┐
                   │          headless agent (shell)         │
                   │                                         │        real Chrome
 discovery ──────► │ candidate pool ─► connect+verify loop   │        (--app, no
 sources           │      ▲                    │             │         address bar)
                   │      │      TLS client: BES CA + SAN     │            ▲
                   │ last-known-good           │             │            │
                   │      cache          verified tunnel     │   http://<uuid>.localhost:PORT
                   │                           │             │   (secure context)
                   │              loopback reverse proxy ─────┼────────────┘
                   └────────────────────────────────────────┘
              on-the-wire: agent→facility is BES-TLS; loopback hop is local-only
```

The trust decision is made by the agent's own TLS client in ordinary code, so no
browser certificate hook is required. On a system-webview or Custom-Tab variant
the same core is reused; only the final hop (loopback origin vs. an in-process
webview) differs.

Shared, runtime-agnostic logic (candidate modelling, the connect/verify state
machine, cache format, the TLS-verification and origin-mapping contract) should
live in a small TypeScript core, so desktop and mobile differ only at the
platform boundary (discovery transports and how the verified connection is
surfaced to a browser).

## Launch → loaded flow

The shell is a small state machine. From cold launch to a loaded website:

1. **Resolve target facility.**
   - If the shell is bound to a single facility (typical single-site install),
     use it.
   - Otherwise pick from cached known facilities, or prompt (offline-capable
     picker). "Which facility" is a stable identity, never an address.

2. **Generate candidates** for that facility (see the candidate stack). This is
   a *broad* set of `(address, port)` guesses from every available source,
   deduplicated, ordered best-first (last-known-good on this network first).

3. **Connect + verify loop.** For each candidate, in order and with bounded
   concurrency, attempt a TLS connection and **verify** it (in the agent's own
   TLS client — no browser hook needed):
   - certificate must chain to the baked-in BES CA, **and**
   - the SAN must equal the target facility identity.
   The first candidate that passes is the server. Everything else — wrong IP,
   stale entry, another facility, an impostor — fails the handshake and is
   discarded. No candidate source needs to be trusted; the certificate is the
   filter.

4. **Bind the stable local origin.** In the preferred model the agent exposes
   the verified tunnel as a stable loopback origin — `http://<facility-uuid>.
   localhost:PORT` (a secure context; persisted port so the origin is constant
   across launches). The winning IP for this session lives only inside the
   agent's upstream TLS client; the browser only ever sees the constant
   localhost origin, regardless of the underlying IP. (A system-webview variant
   binds an equivalent stable origin in-process.)

5. **Launch the browser** at that origin and hand off — real Chrome via
   `--app=http://…` for an address-bar-less window in the preferred model, or an
   in-process webview in the fallback. The shell now only supervises the
   connection.

6. **On connection loss / IP change**, re-run steps 2–3 in the background and
   re-point the tunnel's upstream, keeping the local origin constant. Because
   the browser-facing origin does not change, the site's `localStorage` /
   `IndexedDB` / session survive the reconnect — the user is not logged out and
   the cache is not dropped. Surface a small "reconnecting" state only if it
   takes long enough to matter.

7. **On successful connect**, write the winning `(network fingerprint → address)`
   to the last-known-good cache so the next launch on this network starts there.

Manual entry (below) can inject a candidate at step 2 at any time; it flows
through the same verify loop, so a typed or scanned address is validated
cryptographically, never trusted because a human entered it.

## Candidate discovery stack

Discovery only has to be **broad**; trust does the filtering. Sources, merged
into one pool and tried best-first:

| Source | Transport | Covers | Notes |
|--------|-----------|--------|-------|
| Last-known-good cache | — | Repeat visits on a known network | Keyed by network fingerprint (SSID / gateway MAC / subnet). Tried first. |
| mDNS / DNS-SD | Multicast (v4+v6) | Standard LANs | Use it, don't depend on it: some appliances drop 5353, some mirror it across subnets. |
| Custom UDP multicast | Multicast (v4+v6) | LANs where mDNS specifically is filtered | **IPv6 has no broadcast — multicast is the portable mechanism.** Own group/port; a modernised version of Tamanu's old broadcast ping. |
| Canopy candidate list | HTTPS (cached) | Cross-subnet, multicast-blocked | Server reports its own interface addresses to Canopy while online; client caches the list and tries them all. Only available if fetched during a prior online moment. |
| User entry | — | Zero-infrastructure backstop | Typed address, or **QR scan** (facility console / Canopy shows a QR of identity + candidate addresses) — the ergonomic form on tablets. Once it works, it seeds the last-known-good cache, so entry is once-per-network, not per-session. |

**No active scanning.** The shell deliberately does not sweep or port-scan the
subnet to find the server. Unsolicited connection attempts across a LAN are the
behaviour of malware and are rightly flagged by sysadmins and endpoint security;
we will not ship it. The user-entry backstop (typed or QR-scanned) covers the
case where every passive/announced source fails, without the shell ever probing
hosts it was not told about.

Design implications:

- The discovery core exposes candidates as a **stream** so the connect loop can
  start trying fast sources (cache, entry) immediately while slower sources
  (multicast responses) trickle in.
- A candidate is just `{ address, port, source }`. Sources are pluggable so the
  two shells can supply platform-native transports (Android NSD vs a desktop
  mDNS library) behind one interface.
- **Clock skew** is a real field failure for offline certificate validation
  (a device with no NTP and a wrong clock rejects a valid cert or accepts an
  expired one). The shell should, on connect, sanity-check the device clock
  against the server's and surface "your clock looks wrong" rather than a bare
  TLS error. Decide whether it nudges the clock or only warns.

## Trust enforcement

The requirement: the facility connection must chain to the BES CA (and reject a
publicly-trusted certificate presented for it), while everything else the site
loads keeps using the normal system trust store so external resources still
work. Crucially, this must **not** be done by adding the BES CA to a global
trust store — that would let a public certificate satisfy the facility
connection.

**Preferred model (headless helper): trust is enforced in the agent's own TLS
client, in ordinary code.** The agent is the only thing that speaks TLS to the
facility; it verifies "chains to baked-in BES CA **and** SAN == target facility
identity" itself, with a trust store scoped to *just* the BES anchor for that
connection. The browser never participates in this trust decision — it only ever
talks to `http://<uuid>.localhost`, a secure context needing no certificate at
all. External resources the site loads go straight from the browser over its
normal trust store, untouched. This is cleaner than any browser hook: pinning is
plain client code, and there is no global-store pollution because the BES anchor
never enters the browser's store.

**In-process-webview variants** (system webview / Electron fallbacks) don't have
a separate TLS client, so they need a **per-origin** browser trust hook instead:

- **Electron:** `session.setCertificateVerifyProc` — for the facility origin,
  require chain-to-BES-CA and SAN match, else reject; for every other origin,
  return the "use Chromium default" code so public CAs still work.
- **Android WebView:** declarative via `network_security_config.xml` — a
  `<domain-config>` for the facility host whose `<trust-anchors>` are the bundled
  BES CA, the rest inheriting system trust; enforce the SAN check in code.
- **iOS (deferred):** the `WKNavigationDelegate` `didReceive challenge` delegate
  does per-host custom trust evaluation.

Either way, the property to hold is the same: BES-CA-only for the facility,
system trust for everything else.

Defence-in-depth: putting the facility identity under a reserved namespace
(`.internal`) means no public CA can issue for that name at all, so even a
misconfigured global store cannot be satisfied by a public certificate for it.
Treat this as a backstop, not the primary control.

## Packaging and release

Follows the existing `cd-package-*` pattern (build in CI, attach to the release,
upload artifacts to S3) rather than a new mechanism — but the shell carries its
**own version**, not Tamanu's (see Versioning and compatibility). Releasing
alongside Tamanu is a convenience, not a coupling.

- **Desktop:** a monorepo package (working name `packages/desktop-shell`,
  `@tamanu/desktop-shell`) building the headless agent as a small native binary
  per OS, that launches the user's installed Chrome. It produces signed per-OS
  artifacts; code-signing and macOS notarisation need their own secrets,
  mirroring how `cd-package-frontend.yml` handles signing certs. (A bundled
  Chromium is deliberately avoided — see Renderer and security ownership.)
- **Android:** a sibling shell built with Gradle producing a sideloadable
  `.apk`, mirroring `cd-package-android.yml`. It shares the TypeScript core but
  not the desktop build path — plan it as its own CI job.
- Because the shell hosts no renderer, its updates are rare and never on a
  browser-security clock; keeping product logic out of it keeps the offline
  machines from needing updates at all. Renderer security and the website itself
  both update independently of the shell (the browser via its vendor, the
  website server-side).

## Open questions / decisions before scaffolding

1. **Discovery protocol scope for the first cut.** Wire together mDNS + Canopy
   candidate list + user entry (existing pieces) and defer the custom multicast
   protocol to a later fallback? Or design the wire protocol now? This decides
   whether the first package is "integration" or "protocol design".
2. **Validate the headless-helper + real-Chrome model.** Does the loopback
   reverse proxy carry everything the site needs (WebSockets, streaming,
   host-header/CORS fidelity so the site behaves as at its real origin)? Does
   `chrome --app=http://<uuid>.localhost:PORT` give the address-bar-less window
   we want, and is launching the *installed* Chrome specifically (not the default
   browser) reliable across OSes? If any of this fails, fall back to a
   system-webview wrapper (not bundled Chromium).
3. **Android renderer path.** Confirm whether the loopback-proxy + Chrome Custom
   Tab pattern works (keeps patching with Google), or whether system WebView is
   the pragmatic path.
4. **Facility binding.** Single-facility installs (identity baked at package
   time / first run) vs a multi-facility picker. Affects step 1 of the launch
   flow and how the artifact is distributed.
5. **Clock-skew handling.** Warn only, or actively nudge the device clock from
   the server on connect?
6. **Protocol-stability commitment.** What exactly is frozen as the add-only,
   never-breaking shell↔server contract (discovery record shape, SAN/identity
   convention, localhost origin scheme), so an old shell keeps working against
   all future Tamanu versions?
