# Mobile WebAuthn (native passkeys)

**Status: plan only — not being implemented in the current MFA effort.** This is
split out of `docs/plans/mfa.md` because it carries an external prerequisite the
rest of MFA does not (a Tamanu-owned passkey domain + app entitlement + store
release). Mobile **TOTP** is in scope in the main plan; native passkeys are this
follow-up. Relates to TAM-1848 (MFA for clients).

Read `docs/plans/mfa.md` first — this assumes its WebAuthn data model
(`webauthn_credentials`), the `@simplewebauthn/server` choice, the
multiple-credentials-per-user model, and the "store no signature counter"
decision.

## Why mobile is different

Mobile only ever authenticates to **central**, and one installed app talks to
**many deployments**: it is not an app-store app — builds are downloaded
manually and each is bound to a server version (no single global version is
compatible with every deployment), and at login the app fetches the deployment
list from the Tamanu meta server (`https://meta.tamanu.app/servers`,
`ServerSelector`) and the user picks one. So a single build connects to whichever
central the user selects, and central is the **sole verifier** — no
facility-forwarding, no sync-down, no offline-at-facility dimension. All the
complexity is in how native passkeys bind to a domain.

(Distribution appears **Android-only** — the only mobile CD workflow is
`cd-package-android.yml`, and manual APK download fits Android sideloading; iOS
can't be freely sideloaded. If that holds, only Android Digital Asset Links are
needed, not iOS AASA — confirm with the team. The `ios/` dir exists in the repo
but isn't shipped via CD.)

Native passkeys do **not** bind to a web origin the way the browser does. They
bind to an **associated domain**:

- iOS: the app declares `webcredentials:<domain>` in its Associated Domains
  entitlement; the OS verifies by fetching
  `https://<domain>/.well-known/apple-app-site-association`.
- Android: Digital Asset Links — the OS fetches
  `https://<domain>/.well-known/assetlinks.json`, which must list the app's
  package name and signing-certificate SHA-256.

Both are **build-time** facts (entitlements + signing identity), and the
well-known files must be served over HTTPS at the RP ID domain.

## The blocker

A given build is **one binary that talks to many deployments** (runtime
selection via the meta server). The deployment's domain isn't known until the
user picks a server at login, so the app cannot declare a per-deployment
associated domain — and associated domains are baked in at build/signing time.
Manual/version-bound distribution doesn't change this: the standard build still
fronts every deployment on that server version. (A bespoke per-deployment build —
via the existing `metaServer`/`centralServers` build overrides — *could* embed
its own domain and use the deployment stem RP ID, but that's an exception, not
the default; the plan targets the standard shared build.) There are no
entitlements/associated domains in the app today.

## Resolution: a single Tamanu-owned RP ID domain

Use one Tamanu-controlled domain as the mobile RP ID. **Reuse existing Tamanu
infrastructure** rather than standing up something new: `tamanu.app` (the
registrable parent already serving `meta.tamanu.app`) or a dedicated subdomain is
the natural home — the same infra the app already contacts can host the
associated-domain well-known files.

This works because **native WebAuthn decouples the RP ID from the verifying
server's own domain.** The phone proves the assertion is for the Tamanu RP ID;
central just calls `verifyAuthenticationResponse` with `expectedRPID =` that
domain and `expectedOrigin =` the app's native origin (`android:apk-key-hash:…` /
the iOS form). Central's own hostname is irrelevant to that check, so **every
deployment's central can verify mobile passkeys bound to the shared domain**.

The shared RP ID is **not** a cross-deployment isolation boundary — each
credential lives in its own deployment's central DB, which is the real boundary.
A passkey enrolled against deployment A's central is only ever stored in and
verified by A's central.

These are **separate credentials from web passkeys** (web uses the deployment
stem RP ID; mobile uses the shared Tamanu domain). Users enrol per surface —
consistent with the multiple-credentials-per-user model, but a product
expectation to set.

## Upfront requirements / decisions

1. **Provision the shared RP ID domain.** Host the well-known file(s) on the
   chosen Tamanu domain (reusing the `meta.tamanu.app` infrastructure) —
   `assetlinks.json` for Android (and `apple-app-site-association` if iOS is ever
   shipped). Deployment-independent, set up once, and **maintained forever** —
   this is the prerequisite that kept mobile WebAuthn out of the main effort.
2. **App identity constants.** Capture the Android release signing-cert SHA-256
   (from `release.keystore`) — and the iOS team/bundle ID if iOS ships. They feed
   both the well-known files and central's `expectedOrigin` allow-list for native
   assertions. **Rotating the Android signing key invalidates this** and every
   existing mobile passkey — treat as high-risk, like the web RP ID.
3. **App build changes.** Add Android `assetlinks` verification (and the iOS
   Associated Domains capability if iOS ships — none exist today), plus
   `react-native-passkey` (v3.x; Android `minSdk 31` ✓ ≥ 28; iOS target ≥ 15 if
   relevant). Distribution is the existing manual/version-bound download (no store
   release).
4. **Central config.** Central must accept the mobile RP ID + the app native
   origins for assertion/registration verification. A synced global setting in
   the same family as the web RP ID (`auth.mfa.webauthn.*`).
5. **Online-only.** Mobile verifies against central; offline it uses
   `localSignIn` against local SQLite and there is no local verifier for an
   assertion. For an MFA-required user offline on mobile the factor can't be
   checked — decision: not enforced offline (consistent with today's offline
   password fallback) vs hard block. Until this plan ships, that user's second
   factor on mobile is **TOTP** (online), per the main plan.

## Library

- **`react-native-passkey`** (v3.x) — native passkeys, iOS 15+ / Android API
  28+, unified TS interface, pairs with `@simplewebauthn/server` on central. As
  of v3.3 supports the PRF extension on Android + iOS 18+.

## Out of scope

Everything covered by `docs/plans/mfa.md` (server/web/facility WebAuthn, all
TOTP including mobile TOTP, permissions, feature flag). This plan adds **only**
native passkey support to the mobile client.
