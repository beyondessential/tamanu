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

Mobile only ever authenticates to **central** — a single store build
(`com.tamanuapp`) with runtime server selection (`ServerSelector`), syncing
directly to central. So there is **no facility-forwarding, no sync-down, and no
offline-at-facility dimension**: central is the sole verifier. All the
complexity is in how native passkeys bind to a domain.

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

The app is **one binary pointed at a runtime-chosen server**. The deployment's
domain isn't known until the user selects a server at login, so the app cannot
declare a per-deployment associated domain. Per-deployment (white-label) builds
would solve it but that is not how Tamanu mobile is distributed (single
`com.tamanuapp` listing). There are no entitlements/associated domains in the
app today.

## Resolution: a single Tamanu-owned RP ID domain

Use one Tamanu-controlled domain as the mobile RP ID, e.g. `passkeys.tamanu.io`.

This works because **native WebAuthn decouples the RP ID from the verifying
server's own domain.** The phone proves the assertion is for
`passkeys.tamanu.io`; central just calls `verifyAuthenticationResponse` with
`expectedRPID = passkeys.tamanu.io` and `expectedOrigin =` the app's native
origin (`android:apk-key-hash:…` / the iOS form). Central's own hostname is
irrelevant to that check, so **every deployment's central can verify mobile
passkeys bound to the shared domain**.

The shared RP ID is **not** a cross-deployment isolation boundary — each
credential lives in its own deployment's central DB, which is the real boundary.
A passkey enrolled against deployment A's central is only ever stored in and
verified by A's central.

These are **separate credentials from web passkeys** (web uses the deployment
stem RP ID; mobile uses `passkeys.tamanu.io`). Users enrol per surface —
consistent with the multiple-credentials-per-user model, but a product
expectation to set.

## Upfront requirements / decisions

1. **Provision the shared RP ID domain.** Stand up a Tamanu-controlled domain and
   host AASA + assetlinks for `com.tamanuapp`. Deployment-independent, set up
   once, and **maintained forever** — this is the prerequisite that kept mobile
   WebAuthn out of the main effort.
2. **App identity constants.** Capture the Android release signing-cert SHA-256
   (from `release.keystore`) and the iOS team/bundle ID. They feed both the
   well-known files and central's `expectedOrigin` allow-list for native
   assertions. **Rotating the Android signing key invalidates this** and every
   existing mobile passkey — treat as high-risk, like the web RP ID.
3. **App build changes.** Add the iOS Associated Domains capability +
   `assetlinks` verification (none exist today), plus `react-native-passkey`
   (v3.x; Android `minSdk 31` ✓ ≥ 28; confirm iOS deployment target ≥ 15). Ship a
   store release.
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
