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

## Architecture overview

```
                         ┌─────────────────────────────────────────┐
                         │              client shell                │
                         │                                          │
  discovery sources ───► │  candidate pool ──► connect+verify loop  │
  (see stack below)      │        ▲                    │            │
                         │        │             pin hook (BES CA +   │
                         │   last-known-good          SAN check)     │
                         │        cache               │             │
                         │                            ▼             │
                         │              stable synthetic origin ────┼──► webview
                         │              (name → current IP)         │    loads site
                         └──────────────────────────────────────────┘
```

Two runtimes, same design, shared where practical:

- **Desktop** — Electron. Chosen for a **consistent bundled Chromium** (the
  reason Tamanu standardised on Chrome in the first place) and, decisively, for
  `session.setCertificateVerifyProc`, which gives per-origin trust scoping (see
  Trust below). Emits per-OS artifacts.
- **Android** — a thin native WebView app (Gradle toolchain, separate from the
  React Native app in `packages/mobile`). Per-domain trust scoping is
  declarative via a Network Security Config. Emits a sideloadable `.apk`.

Shared, runtime-agnostic logic (candidate modelling, the connect/verify state
machine, cache format, the name→IP mapping contract) should live in a small
TypeScript core so the two shells differ only at the platform boundary
(discovery transports, the certificate-verification hook, and the webview host).

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
   concurrency, attempt a TLS connection and apply the **pin hook**:
   - certificate must chain to the baked-in BES CA, **and**
   - the SAN must equal the target facility identity.
   The first candidate that passes is the server. Everything else — wrong IP,
   stale entry, another facility, an impostor — fails the handshake and is
   discarded. No candidate source needs to be trusted; the certificate is the
   filter.

4. **Bind the stable synthetic origin.** Map the facility's stable name (e.g.
   `abc123.facility.internal`) to the winning IP for this session, so the
   webview always loads `https://abc123.facility.internal/…`. The site sees one
   constant, trusted, secure origin regardless of the underlying IP.

5. **Load the website** in the webview against that origin and hand off. The
   shell now only supervises the connection.

6. **On connection loss / IP change**, re-run steps 2–4 in the background while
   keeping the origin identity constant. Because the origin does not change,
   the site's `localStorage` / `IndexedDB` / session survive the reconnect —
   the user is not logged out and the cache is not dropped. Surface a small
   "reconnecting" state only if it takes long enough to matter.

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
| Bounded subnet sweep | TCP connect | Absolute last resort | Noisy; safe only because the cert filters it. Bound tightly. |

Design implications:

- The discovery core exposes candidates as a **stream** so the connect loop can
  start trying fast sources (cache, entry) immediately while slower sources
  (multicast responses, sweep) trickle in.
- A candidate is just `{ address, port, source }`. Sources are pluggable so the
  two shells can supply platform-native transports (Android NSD vs a desktop
  mDNS library) behind one interface.
- **Clock skew** is a real field failure for offline certificate validation
  (a device with no NTP and a wrong clock rejects a valid cert or accepts an
  expired one). The shell should, on connect, sanity-check the device clock
  against the server's and surface "your clock looks wrong" rather than a bare
  TLS error. Decide whether it nudges the clock or only warns.

## Trust and the pin hook

The requirement is **per-origin** pinning: the facility origin must chain to the
BES CA (and reject a publicly-trusted certificate presented for that origin),
while **every other origin keeps using the normal system trust store** so the
website can still reach external resources.

There is no web-platform API for this (HPKP was removed years ago, no
replacement). It is a **native-shell capability** — which is itself an argument
for the shell over the service-worker approach, which would be stuck with the
global store.

**Desktop (Electron):**

```js
session.setCertificateVerifyProc((request, callback) => {
  const { hostname, certificate } = request;
  if (isFacilityOrigin(hostname)) {
    // hard pin: must chain to baked-in BES CA AND SAN must match the
    // target facility identity. Public CAs are NOT acceptable here.
    return callback(chainsToBesCa(certificate) && sanMatches(certificate, hostname) ? 0 : -2);
  }
  return callback(-3); // everything else: Chromium's default verification
});
```

**Android (WebView):** declarative, no code — a `network_security_config.xml`
with a `<domain-config>` for the facility host whose `<trust-anchors>` point at
the bundled BES CA, while the rest of the app inherits system trust. Enforce the
SAN==identity check in the connect loop before binding the origin.

**iOS (deferred):** the `WKNavigationDelegate` `didReceive challenge` delegate
does per-host custom server-trust evaluation — same idea when the time comes.

Defence-in-depth: putting the facility origin under a reserved namespace
(`.internal`) means no public CA can issue for that name at all, so even a
misconfigured global store cannot be satisfied by a public certificate for it.
Treat this as a backstop, not the primary control — the hard native pin is the
primary control.

## Packaging and release

Follows the existing `cd-package-*` pattern (build in CI, attach to the release,
upload versioned artifacts to S3) rather than a new mechanism.

- **Desktop:** a monorepo package (working name `packages/desktop-shell`,
  `@tamanu/desktop-shell`) built with Electron + an installer/packager
  (electron-builder or similar), producing signed per-OS artifacts
  (`.exe`/`.msi`, `.dmg`, `.AppImage`/`.deb`). Code-signing and macOS
  notarisation are required for a smooth install and need their own secrets,
  mirroring how `cd-package-frontend.yml` handles signing certs.
- **Android:** a sibling shell built with Gradle producing a sideloadable
  `.apk`, mirroring `cd-package-android.yml`. It shares the TypeScript discovery
  core but not the desktop build path — plan it as its own CI job.
- The shell is thin and near-static; **shell updates are themselves an online
  operation**, so keeping product logic out of it minimises how often the
  offline machines must be updated at all. The website continues to update
  server-side, independent of the shell.

## Open questions / decisions before scaffolding

1. **Discovery protocol scope for the first cut.** Wire together mDNS + Canopy
   candidate list + user entry (existing pieces) and defer the custom multicast
   protocol to a later fallback? Or design the wire protocol now? This decides
   whether the first package is "integration" or "protocol design".
2. **Desktop runtime confirmation.** Electron (consistent bundled Chromium + the
   `setCertificateVerifyProc` hook) vs Tauri (small binary, but system webview
   reintroduces the cross-engine drift Tamanu deliberately escaped). This design
   assumes Electron.
3. **Facility binding.** Single-facility installs (identity baked at package
   time / first run) vs a multi-facility picker. Affects step 1 of the launch
   flow and how the artifact is distributed.
4. **Clock-skew handling.** Warn only, or actively nudge the device clock from
   the server on connect?
5. **How much shared core is worth it** between the desktop and Android shells
   before the platform boundary (discovery transports, verify hook, webview
   host) — i.e. where exactly to draw the TypeScript-core / native-shim line.
```
