# Multi-factor authentication (WebAuthn + TOTP)

Linear: TAM-1652 (admin panel) + TAM-1848 (clients). The card scopes a PoC to
the admin panel, but we are speccing and building the **full scope** — admin
panel, clinical web, facility logins, and **mobile TOTP** — in this plan. Mobile
**WebAuthn** (native passkeys) is planned separately in
`docs/plans/mfa-mobile-webauthn.md` and not built in this effort, because it
carries an external prerequisite (a Tamanu-owned passkey domain hosting
associated-domain files + an app entitlement + a new app build) the rest of MFA
does not. TAM-1652 independently
specified the RP-ID-as-common-stem design and the passkey-invalidation warning
captured below, and flagged secure TOTP distribution to facilities as a separate
concern (which this plan resolves by never distributing the seed — central-only
verification).

## Goal

Add a second authentication factor for Tamanu users. Two factor types:

- **WebAuthn / passkeys** — the preferred factor.
- **TOTP** (authenticator app) — secondary, for users without a usable
  authenticator.

A login goes through the second factor when MFA is enabled and the account has a
factor (or is required to). Enablement is a global feature flag; per-user
applicability is driven by the two permissions below.

The design is shaped almost entirely by Tamanu's central/facility split and the
sync system, so most of this document is about *where secrets live and how they
(don't) move*, not about the MFA mechanics themselves.

## Background: the constraints that drive every decision

- **Users sync down only.** `User` is `PULL_FROM_CENTRAL`
  (`packages/database/src/models/User.ts`). The password travels over sync as a
  **bcrypt hash** — one-way, safe to replicate. Anything we add to a synced
  table inherits the same "ends up in every facility DB" property.
- **Login already has a central/local split.** Facility login tries central
  first and falls back to local
  (`packages/facility-server/app/middleware/auth.js`,
  `centralServerLoginWithLocalFallback`). Password reset / change are simply
  **forwarded to central** (`resetPassword.js`, `changePassword.js` forward via
  `CentralServerConnection.forwardRequest`). Central is the trust anchor.
- **Credential check seam.** Password verification happens in
  `User.loginFromCredential()` (`User.ts`, after the bcrypt `compare`, before
  device registration and token issue). That boundary is where a second-factor
  gate slots in.
- **Ephemeral-token precedent.** `OneTimeLogin` (`DO_NOT_SYNC`) is the existing
  pattern for short-lived, per-server tokens (used by password reset). MFA
  challenges follow the same pattern.
- **Encryption-at-rest primitive exists.** `packages/shared/src/utils/crypto.js`
  provides `encryptSecret` / `decryptSecret` (versioned AES) keyed by a PSK from
  a config key file. Secret *settings* are stored encrypted in the `Setting`
  table.

### The key asymmetry between the two factors

|                | Stored secret        | Safe to replicate?      | Offline at facility? | Cross-origin portable? |
|----------------|----------------------|-------------------------|----------------------|------------------------|
| **WebAuthn**   | public key only      | ✅ leak is a non-event  | ✅                   | ❌ origin-bound (see RP ID) |
| **TOTP**       | symmetric seed       | ❌ replicating = leaking | only if replicated  | ✅                     |

WebAuthn stores only public keys, so credentials can be replicated to every
facility and verified **offline** with no shared secret. TOTP's seed is
symmetric and recoverable, so replicating it widens the blast radius to every
facility DB — therefore TOTP stays **central-only** and is verified only when
online to central. This asymmetry is why the two factors get different storage,
sync, and offline behaviour.

## Decisions

### WebAuthn is the primary, offline-capable factor

- Credentials store `{ credentialId, publicKey, transports, aaguid, rpId,
  originEnrolledAt, friendlyName, createdAt, lastUsedAt }`.
- **Multiple credentials per user** — essential, not optional. It is both the
  expected model (laptop + phone + hardware backup key) and the anti-lockout
  story. At assertion, offer the user's credential list (or discoverable creds).
- Public keys are safe to sync, so the table is **`BIDIRECTIONAL`**: a credential
  enrolled at a facility flows up to central and back down to siblings, and any
  in-zone server can verify offline. (As a BIDIRECTIONAL model it must implement
  `buildSyncLookupQueryDetails` — returning `null`, like other sync-everywhere
  tables — or the sync_lookup refresh throws.)
- **Mobile needs no local table for it.** Mobile builds its pull list from its
  own models and central snapshots only the requested tables
  (`filterModelsFromName` in `setupSnapshotForPull`), so a table mobile has no
  model for is never requested, never pushed, never an error — it just doesn't
  sync there. That's the right outcome: mobile can't use web-origin passkeys
  anyway (mobile WebAuthn is its own deferred effort). No mobile TypeORM
  migration is required by this table.

#### RP ID and the "can this server do WebAuthn locally?" predicate

WebAuthn credentials are bound to a **Relying Party ID**, which must be a
registrable domain suffix of the origin. Tamanu deployments are expected to put
central and facilities under a shared parent domain
(`central.foo.bar.com`, `facility-a.foo.bar.com`, …), so a single RP ID of
`foo.bar.com` lets one credential assert across every subdomain.

- **RP ID is a global setting**: `auth.mfa.webauthn.rpid` (e.g. `foo.bar.com`).
  Not secret, deployment-wide, and `PULL_FROM_CENTRAL` settings sync it to every
  facility — so each server has it offline.
- **The server's own origin** (`canonicalHostName`) is the only per-server input
  and is already known/trusted at login time. (It must be the *trusted*
  self-origin, not the client-sent `Origin`, or WebAuthn's origin check is
  meaningless.)
- **Capability predicate**, computable offline at every server:

  ```
  canDoWebAuthnLocally = originIsUnderRpId(ownOrigin, settings.auth.mfa.webauthn.rpid)

  originIsUnderRpId(origin, rpId) = (origin === rpId) || origin.endsWith('.' + rpId)
  ```

  The leading dot is required — a naïve `endsWith(rpId)` would let
  `evilfoo.bar.com` match `foo.bar.com`. This mirrors the browser's own check.
- The predicate gates **both enrollment and assertion** (the rpid-suffix rule
  applies to both ceremonies).
- **When the predicate is false** (out-of-zone facility on a customer/government
  domain): **refuse** WebAuthn locally and fall back to TOTP/password. We are
  **not** building a delegated/IdP-style flow (no redirect-to-central IdP) —
  out-of-zone facilities simply don't offer WebAuthn.
- **RP ID is effectively set-once.** Changing it after enrollment invalidates
  every existing credential (rpid mismatch → assertions refuse). Guard the
  setting against casual edits and warn loudly in the admin UI.

#### Signature counter — not stored

The counter only detects a *cloned* authenticator (extracted private key). That
threat is high-sophistication, already undetectable for synced passkeys (which
report counter 0 by design), and **actively harmful to enforce** in a
sync-lagged/offline topology (a server routinely sees a "regressed" counter
simply because it hasn't received another server's update yet). Since we'd never
act on it, we don't store it at all — pass `0` as the stored counter to the
verifier on every assertion (the verifier treats `0`/`0` as "counter
unsupported" and does no regression check). No column, no sync-merge question.

#### Cross-device (hybrid) — free with the web flow, for both enrol and auth

The "scan a QR with my phone while on the laptop" flow is the WebAuthn **hybrid
transport**, and it works for **both ceremonies**: `create()` (enrol a phone
passkey from the laptop) and `get()` (sign in). Supported for free by the web
scope, with no server work:

- The QR / BLE proximity check / tunnel are handled by the OS + browser, relayed
  through **Apple/Google** servers — we run no relay.
- The phone acts as a **roaming authenticator via its OS passkey manager**, not
  via the Tamanu mobile app, and creates/asserts a passkey bound to the **web RP
  ID (the stem)**. So this is purely the web path and is **unrelated** to the
  separate mobile-app passkey plan (`docs/plans/mfa-mobile-webauthn.md`).

All we must do is **not disable it**: don't pin `authenticatorAttachment` (leave
it unset, for `create()` and `get()` alike); store the registration `transports`
(already in the credential record) and echo them in `allowCredentials` for the
username-first auth path; the usernameless path sends empty `allowCredentials`,
which surfaces the phone option natively. `userVerification: 'required'` is
satisfied by the phone's biometric.

Notes: it is **online-only** (the relay needs internet on both devices), so it
won't work at an offline facility — which refines the offline force-enrol claim
in Enforcement: in-zone offline enrolment works only with a **local**
authenticator (platform passkey / security key), not the phone-over-QR path. It
is an especially strong fit for **shared clinical workstations** (and their
forced-enrolment): a user with no local passkey enrols/signs in by scanning with
their phone, no per-workstation setup.

### TOTP is the central-only secondary factor

- **Symmetric seed → central-only.** Stored in a dedicated per-user table that
  is **not synced to facilities** (`DO_NOT_SYNC`, or otherwise kept out of
  facility scope). Verified only at central; facilities **forward** the entered
  code to central (the `changePassword` forwarding pattern).
- **Encrypted at rest** by reusing the existing secrets mechanism as-is:
  `encryptSecret` / `decryptSecret` from `shared/utils/crypto.js`, keyed by the
  existing `crypto.settingsPsk`. No new key is invented. The blast-radius
  protection comes entirely from the table being **central-only** — since the
  ciphertext never syncs to facilities, it is irrelevant that facilities also
  hold the PSK. Encryption-at-rest is therefore pure defence-in-depth against a
  central DB *dump* (you'd also need the key file). (Minor: a key named
  "settingsPsk" guarding non-settings data is slightly awkward; alias the
  concept later if desired — not worth solving now.)
- **No offline TOTP.** If central is unreachable, the TOTP step cannot complete.
  See "Offline + MFA-required" below.
- **One seed per user.** Re-enrolling replaces the existing seed. Multiple TOTP
  seeds add no security and no real UX (one seed can be enrolled into multiple
  apps), so we don't support them. The backup-device need is met by multiple
  WebAuthn credentials; the lockout backstop is admin reset (below).
- **Availability is gated by a global setting** `auth.mfa.totp.availability` =
  `all | fallbackOnly | off` (one enum subsumes the on/off toggle):
  - `all` — TOTP offered as a factor/enrolment option on every surface.
  - `fallbackOnly` — TOTP offered **only where WebAuthn is unavailable for this
    login** (mobile, and out-of-zone facilities). On WebAuthn-capable surfaces
    (admin/clinical web, in-zone facilities) TOTP is neither offered nor accepted
    — those users are steered to / forced onto passkeys. Lets a deployment
    enforce phishing-resistant MFA where it can without locking out the rest.
  - `off` — no TOTP anywhere (WebAuthn-only deployment).
  This composes with force-enrolment: a `fallbackOnly` web user whose only factor
  is TOTP isn't locked out — the WebAuthn-capable surface force-enrols a passkey
  (passkey-first interstitial). Per-role TOTP gating is deferred (as with
  passwordless).

### Recovery: admin reset / provisioning (no recovery codes)

There are **no recovery codes**. The recovery path is an admin resetting the
locked-out user. An admin who is themselves locked out appeals to tech support,
who have additional out-of-band checks. This needs:

- **Admin reset MFA** — clear a user's factors so they re-enrol.
- **Admin pre-enrol / provision** — provision a factor on a user's behalf.
  Mechanics differ by factor:
  - *WebAuthn via hybrid QR* (**preferred — "come to IT", in person**): the admin
    starts an enrol-for-user-X ceremony; the server issues registration options
    bound to X's handle; the admin's screen shows the QR; **the user scans it
    with their own phone** and the passkey is created on the user's device. The
    private key never leaves the user's phone — the admin only relays the public
    attestation, so the admin gains nothing that could impersonate the user.
    **Strictly in-person and synchronous**: hybrid requires BLE proximity between
    the user's phone and the admin's machine, a live pending ceremony in the
    admin's browser, and the QR is single-use/short-lived. So you **cannot print
    or email the QR** — that has no BLE peer and a dead session. This is the
    deliberate phishing-resistance/proximity property. Online-only; runs from the
    admin panel (in-zone). (See Cross-device.)
  - *WebAuthn with a hardware key in hand*: alternatively the admin runs the
    ceremony with a security key physically present, then hands it over — for
    issuing org-owned hardware keys.
  - *Enrolment-invite token* (**for remote/async provisioning**): the admin
    generates a time-limited token; the user receives it (link/email) and opens
    it **on their own device**, where they self-run the normal WebAuthn `create()`
    (or TOTP enrol) on their own authenticator, on their own schedule. Reuses the
    `OneTimeLogin` pattern (as password reset does). It does **not** require the
    target user to hold `write Mfa` — the token carries the admin's `write
    UserMfa` authority. **Security (required):** the token is a bearer
    authorisation to enrol an authenticator on the account, so interception → an
    attacker enrols their *own* passkey → takeover. Redemption **must** therefore
    require the user to **also authenticate** (token *and* password) — the token
    alone is never sufficient — and the token **must** be short-lived and
    single-use. Not optional.
  - *TOTP*: the admin generates the seed, which means the admin **sees** it —
    acceptable for provisioning, but weaker than the hybrid-QR path.

All gated by the `UserMfa` admin permissions (see Permissions).

### Two tables, opposite profiles

Do **not** force a uniform table — the factors have opposite sync and secrecy
needs, even though the UI presents one "your security methods" list:

| Table | Cardinality | Contents | Sync direction | At rest |
|-------|-------------|----------|----------------|---------|
| `webauthn_credentials` | N per user | public keys | `BIDIRECTIONAL` | plaintext (public) |
| `totp_secrets` | 1 per user | symmetric seed | `DO_NOT_SYNC` (central-only) | encrypted (`crypto.settingsPsk`) |
| MFA challenges (ephemeral) | per ceremony | random nonce | `DO_NOT_SYNC` | — |

Challenges are issued and verified by whichever server runs the ceremony
(`OneTimeLogin` pattern), so in-zone WebAuthn works fully offline.

## Enablement: feature flag

A global on/off flag (TAM-1652) — a synced global setting, e.g.
`auth.mfa.enabled` (`PULL_FROM_CENTRAL`, like the RP ID). It is the kill-switch
and rollout gate:

- **Off**: no enrolment offered, no enforcement, login behaves exactly as today.
  The two permissions are inert.
- **On**: enrolment is offered to users with `write Mfa`, enrolled factors are
  required at login, and `require Mfa` users are force-enrolled.

This is distinct from the permissions: the flag decides *whether MFA exists for
this deployment at all*; the permissions decide *which users may/must use it*.
Keeping enablement as a setting (not config) fits the reduce-config goal and
lets it be toggled centrally and roll out via sync.

Per-factor settings sit under the same `auth.mfa.*` family:
`auth.mfa.totp.availability` (`all | fallbackOnly | off`, see TOTP) and
`auth.mfa.passwordless` (`off | onRequest | promoted`, see Conditional access B).

### Settings & defaults

Governing principle: the whole feature is **opt-in**, a bare `enabled = true`
must be **non-disruptive**, and every security-sensitive list defaults to its
**safe** value. All are synced settings (`PULL_FROM_CENTRAL`).

| Setting | Type | Default | Why |
|---------|------|---------|-----|
| `auth.mfa.enabled` | bool | **`false`** | Opt-in. Enabling alone only *makes enrolment available* — forces/challenges no one — so it's safe to flip on. |
| `auth.mfa.webauthn.rpid` | string | **`""` (unset)** | No safe guess for the domain; empty ⇒ WebAuthn unavailable (fail-safe) ⇒ TOTP/password. Set the common stem to enable passkeys. |
| `auth.mfa.totp.availability` | `all\|fallbackOnly\|off` | **`all`** | Once on, TOTP usable everywhere; deployments tighten as desired. |
| `auth.mfa.passwordless` | `off\|onRequest\|promoted` | **`onRequest`** | Capability available without changing the password-first default UX. |
| `auth.ipAllowlist` | CIDR[] | **`[]`** | Empty ⇒ no login IP restriction; a non-empty default would lock people out. |
| `auth.mfa.ipExempt` | CIDR[] | **`[]`** | Empty ⇒ no one exempt ⇒ everyone gets MFA. Fail-closed. |
| `auth.mfa.enrolInvite.expiry` | duration | **short** (mirror `auth.resetPassword.tokenExpiry`) | Invite tokens are powerful; single-use + short-lived, redeem requires token + password. |

**"Just flipped `enabled = true`" state** is deliberately benign: TOTP available
everywhere, passkeys available *on request once an rpid is set* (none until
then), no IP rules, and **nobody forced** (`require Mfa` is a permission,
default-ungranted). MFA becomes optional/available; forcing is the separate,
explicit step of granting `require Mfa`.

**Not settings, but need default decisions:**

- *Permission seeding* — default-grant **`write Mfa` to all roles**,
  **`read`/`write UserMfa` to admin roles only**, and **never** default-grant
  `require Mfa`.
- *Fixed constants* (deliberately not exposed) — TOTP digits 6 / period 30s /
  SHA-1 / window ±1 (authenticator compatibility); WebAuthn
  `userVerification: required`, `residentKey: preferred` + `credProps`, ceremony timeout ~60s.

## Permissions

Covers the two permissions TAM-1652 calls for ("permission to set MFA devices"
and "require a certain role to have MFA"), plus the admin recovery actions.

Tamanu permissions are `(verb, noun, objectId?)` tuples, defined in the DB
(`Permission` model, `PULL_FROM_CENTRAL`), assigned to roles, and compiled into
CASL abilities (`packages/shared/src/permissions/buildAbility.js`). The split
chosen: noun **`Mfa`** = acting on *your own* MFA, noun **`UserMfa`** = acting on
*another user's* MFA (admin).

| Permission | Meaning |
|------------|---------|
| `write Mfa` | Manage your own MFA — enrol and remove your own factors. Gates the self-service enrolment endpoints. |
| `require Mfa` | **Enforcement flag.** Presence on a user's role ⇒ that user **must** have a factor configured (see Login flow). |
| `read UserMfa` | Admin: view another user's MFA status. |
| `write UserMfa` | Admin: reset / pre-enrol another user (the recovery + provisioning actions above). |

- Self-service endpoints check `req.ability.can('write', 'Mfa')`; admin
  endpoints check the `UserMfa` verbs — all with `req.flagPermissionChecked()`.
- **`write Mfa` gates *self-initiated* enrolment only.** Admin-driven enrolment —
  hybrid QR, hardware key, *and* the invite token — is authorised by the admin's
  `write UserMfa`; the **target user needs no MFA permission at all**. The invite
  token specifically carries the admin's authority to the user's own device:
  redeeming it enrols a factor without the user holding `write Mfa`.
- Consequence: a deployment may grant `write Mfa` to **no one** and provision all
  MFA via admins — fully coherent. It also softens the pairing below.
- `write Mfa` and `require Mfa` are independent: a role can grant *may-enrol*,
  *must-enrol*, both, or neither. A `require`-d role without `write Mfa` only
  affects the *self-service* forced-enrolment path (the user can't self-enrol at
  the interstitial); they can still be covered by an admin invite/provision. Best
  to still pair `require` ⇒ `write Mfa` so self-service works, but it's no longer
  a hard contradiction.
- All sync to facilities with the rest of the permission set, so both the
  "may this user enrol" and "is MFA required for this user" checks are available
  wherever login happens.

## Login flow changes

- **TOTP**: after the password `compare` in `User.loginFromCredential()`, if the
  user has TOTP enrolled (and/or is MFA-required), issue a partial/challenge
  state instead of a token; complete on TOTP verification (central). Facility
  forwards the code to central.
- **WebAuthn**: the single login POST becomes a two-phase exchange (issue
  challenge → verify assertion). Shared challenge plumbing with TOTP.
- **Login response** (`packages/central-server/app/auth/login.js`,
  facility `auth.js`) gains fields to express "MFA required, here are your
  available factors / challenge" so web and mobile can drive the second step.
- **Pending pass**: a paused login withholds the access and refresh tokens and
  returns a short-lived JWT (~5 min, audience `mfa_login`) scoped to the
  `/mfa/login` completion endpoints only — long-lived credentials are minted
  only once the factor is satisfied. It carries `deviceId` so the completion's
  token gets the right claim (the client also echoes `deviceId` in the
  completion body for the facility path). The pass is **single-use**: a nonce
  stored in `mfa_challenges` is checked live on every completion call and
  atomically consumed on a successful terminal step (after the factor is
  verified, so a wrong code doesn't burn it), so a completed pass can't be
  replayed within its lifetime.

## Enrollment flow

Authenticated self-service on one's own account — a **new seam** (today there is
no authenticated "change my own credential" endpoint; password reset is
unauthenticated, admin edits act on others).

- **WebAuthn**: `register-begin` (server issues challenge + RP info) →
  `navigator.credentials.create()` → `register-finish` (verify attestation,
  store credential). Runs against whichever in-zone origin the user is on;
  credential created with the shared RP ID; flows over sync (`BIDIRECTIONAL`).
  The ceremony is **fully local** — challenge and verification never touch
  central — so in-zone WebAuthn enrolment works **offline** and syncs up later.
- **TOTP**: `enrol` (central generates seed, stores **pending**, returns
  `otpauth://` URI for QR) → user enters a code → `confirm` (central verifies
  against pending seed, marks active). Pending seed lives in the central-only
  table, never the synced `User` row. Requires central connectivity.

## UI surfaces

The endpoints are useless without somewhere to click. Three surfaces, all PR1:

- **Self-service modal** (web client, facility + central): a "Two-factor
  authentication" item in the sidebar kebab menu — visible only when
  `auth.mfa.enabled` and the user has `write Mfa`. Opens a modal with the
  user's security methods list (passkeys with name/created/last-used, and
  authenticator-app status), *add passkey* (`@simplewebauthn/browser`
  ceremony), *add authenticator app* (QR + manual key + confirm code), and
  *remove* per factor.
- **Facility `/api/mfa` routes**: the self-service router exists on central
  only; facility users need their own. WebAuthn registration runs **locally**
  at in-zone facilities (shared ceremony code, local tables, credential syncs
  up — works offline, per the enrolment-flow design). TOTP is **not offered in
  facility self-service**: `forwardRequest` authenticates as the facility's
  central user, not the end user, so a forwarded enrolment would act on the
  wrong account — and TOTP is central-bound anyway. The facility modal says so;
  authenticator apps are set up on central's webapp, via the login
  interstitial, or by admin invite. The facility methods list shows local
  passkeys and reports authenticator-app status as managed centrally.
- **Admin panel** (central, user edit modal): an MFA section showing factor
  status, with *reset* (remove all factors), invite issuance, and *in-person
  provisioning* (hybrid QR). Plus an MFA status column in the users table.
  Invites are issued two ways: **email it to the user** (server-sent, with
  step-by-step instructions; the token is never shown to the admin) or
  **generate a token** to pass over another channel. Email is a fine channel
  *by design*: the token alone cannot enrol anything — redemption requires the
  user's password, and the token is single-use and short-lived.
- **Invite redemption page**: reached from the "Have an MFA enrolment invite?"
  link on the login screen — token + email + password opens the enrol session,
  then the passkey/TOTP enrolment UI runs against the enrol-session endpoints.
  Works on facility frontends too: the enrol-session token travels in the
  request body (like the mfa_login pass) precisely so facilities can forward
  every step to central verbatim.

## Enforcement: force-enrolment, decided

**No downgrade, ever** — silently dropping to password-only when central is
unreachable would be a full MFA bypass (cut the link, skip the factor). An
MFA-required (`require Mfa`) user who has no factor is driven into a
**forced-enrolment** interstitial after password verification, before any
session is usable.

What that means by location, for an MFA-required user with **no factor yet**:

- **In-zone facility** (WebAuthn-capable, `canDoWebAuthnLocally === true`): they
  are force-enrolled into a WebAuthn credential **on the spot, even offline** —
  the ceremony is local, the credential works immediately and syncs up later. No
  block. (Offline this requires a **local** authenticator; the phone-over-QR
  hybrid path needs internet — see Cross-device.)
- **Out-of-zone facility, offline**: WebAuthn can't run (rpid mismatch — even a
  synced credential won't assert at that origin) and TOTP can't verify (central
  unreachable) → **hard block**. This is an inherent consequence of the
  topology, not a tunable policy.
- **Anywhere online**: can always complete enrolment (WebAuthn in-zone, or TOTP
  via central).

So the hard block only bites *out-of-zone + offline* facilities; in-zone
facilities can always self-rescue via local WebAuthn enrolment.

**Which factor the interstitial leads with:** when both are available (in-zone +
online) it leads with **"Set up a passkey"** as the primary call to action, with
"Use an authenticator app instead" as a secondary link — steering users to the
stronger, offline-capable factor. When WebAuthn isn't available (out-of-zone),
only TOTP is offered (no choice). On an exempt network the interstitial is
skippable (see Conditional access A).

### The enforcement check is a policy decision, not a constant

"What auth does this login need?" is computed at login time from several inputs,
not hardcoded to "always two factors":

- feature flag on?
- does the user have a factor / is the user `require Mfa`?
- **which factors are available here** — `auth.mfa.totp.availability` × whether
  WebAuthn is available for this login (so `fallbackOnly` hides TOTP on
  WebAuthn-capable surfaces).
- **IP zone** (see Conditional access A) — exempt range may skip the factor.
- **auth method used** (see Conditional access B) — a user-verifying passkey
  assertion satisfies strong auth on its own, so no separate second step.

Implement this as one small, well-tested policy function consumed by both the
central and facility login paths, rather than scattering conditionals.

## Conditional access (advanced)

### A. IP-range policy (restrict logins / exempt MFA by zone)

Two independent, security-sensitive knobs, as CIDR list settings (per-facility
with a global fallback; `PULL_FROM_CENTRAL`, so evaluable offline at the edge).
They are deliberately split across two namespaces because they are different
concerns:

- **`auth.ipAllowlist`** — a **login-level** gate (not MFA): refuse login
  entirely from outside the listed range(s). Lives under `auth.` directly
  because it has nothing to do with MFA.
- **`auth.mfa.ipExempt`** — MFA conditional-access: a trusted range (e.g.
  intranet) skips the second factor; everywhere else (e.g. internet) requires
  it. (Leaf key isn't re-prefixed with "mfa" — it's already in that namespace.)

**Client IP — already handled.** Tamanu sits behind a reverse proxy (Caddy), but
the trust boundary already exists: `config.proxy.trusted` drives Express
`trust proxy` on both central and facility (`createApi.js`,
`addFacilityMiddleware.js`), and `req.ip` respects it (rate-limiting already
keys off it). So we reuse `req.ip` for CIDR matching (`ipaddr.js`; IPv4, IPv6,
v4-mapped-v6). This is **fail-closed**: if a deployment's proxy isn't configured
in `config.proxy.trusted`, `req.ip` is the proxy's own address, which won't match
any intranet CIDR, so the MFA exemption simply doesn't apply and everyone gets
MFA. A spoofed `X-Forwarded-For` cannot manufacture an exemption.

**Where evaluated:** at the point of first contact, since that is where the
user's real IP is visible — **facility** for facility logins (central only sees
the facility's IP otherwise), **central** for direct/admin/mobile. CIDR settings
sync, so a facility evaluates locally even offline.

**Deliberate trade-off:** MFA-exempt-by-IP makes *network position* a factor — a
compromised host inside the trusted range bypasses MFA. This is an accepted
posture, to be enabled knowingly.

**Exempt + `require Mfa` (decided — hybrid):** a `require Mfa` user with no
factor, logging in from an exempt range, is **shown the forced-enrolment
interstitial but may skip it** and proceed (they're exempt anyway). Off-network
the same interstitial is **mandatory**. This nudges early enrolment without
hard-blocking on the trusted network, while still enforcing the requirement the
moment they're off it.

### B. Single-factor passkey (passwordless)

A passkey used *instead of* a password, not after it — the strongest and
phishing-resistant path.

- **`userVerification: 'required'`** at assertion: a passkey with biometric/PIN
  UV is possession + inherence, so it satisfies "MFA" by itself. The policy
  function treats a verified passkey assertion as fully authenticated — no
  separate second factor.
- **Discoverable credentials, detected not forced** (`residentKey: 'preferred'`
  + the `credProps` extension at registration): usernameless ("Sign in with a
  passkey", no email typed) only works if the authenticator stored the
  credential as discoverable. Rather than force `'required'` (which blocks
  authenticators that can't store a resident key), enrol permissively and read
  `credProps.rk` from the registration response into
  `webauthn_credentials.discoverable` (true = passwordless-capable, false =
  second factor only, null = unknown). The UI marks non-discoverable passkeys
  as "second factor only", so a user without a passwordless-capable device can
  still enrol — they just see why passwordless isn't offered for that key.
  (A device that only creates a resident key under `'required'` won't be
  passwordless-capable under `'preferred'`; deployments that want to guarantee
  passwordless capability — at the cost of rejecting authenticators that can't
  store a resident key — set `auth.mfa.webauthn.residentKey` to `'required'`,
  which is then used at every enrolment entry point.) User handle = the Tamanu
  user UUID (stable, not PII).
- **New parallel login entry**: `assert-begin` / `assert-finish` with no
  password, separate from the password path that gates in `loginFromCredential`.
  The password still exists underneath for admin reset / recovery — passwordless
  is an *added* method, not removal of the credential.
- **Policy-gated by a global setting** `auth.mfa.passwordless` =
  `off | onRequest | promoted` (tri-state, mirroring TOTP availability):
  - `off` — no passwordless entry; passkeys serve only as a second factor after
    the password. The server **rejects** passwordless assertions.
  - `onRequest` — passwordless is available but **opt-in per login**: the login
    screen is password-first and the user must explicitly invoke "Sign in with a
    passkey"; no conditional-UI/autofill auto-prompt.
  - `promoted` — passwordless surfaced by default: WebAuthn **conditional UI**
    (`mediation: 'conditional'`, autofill) actively offers passkeys and the
    passkey CTA is primary.
  The `off` vs (`onRequest`|`promoted`) boundary is **server-enforced** (whether
  passwordless assertions are accepted at all); `onRequest` vs `promoted` is
  purely **web-client presentation** (whether to use conditional UI and how
  prominent the CTA is). Default `onRequest` (capability available without
  changing the default login UX). Per-role refinement deferred.
- **Offline payoff**: a passkey-only UV login works **offline at an in-zone
  facility** — local public-key verification, no password, no central — strictly
  better than the password+TOTP path offline.

## Scope / endpoints (initial)

- `POST .../mfa/webauthn/register-begin` / `register-finish`
- `POST .../mfa/webauthn/assert-begin` / `assert-finish`
- `POST .../mfa/totp/enrol` / `confirm`
- `POST .../mfa/totp/verify` (central; facility forwards)
- `GET/DELETE .../mfa/methods` (list / remove your own factor — `write Mfa`)
- Admin (`UserMfa`): view status, reset (clear factors), pre-enrol/provision,
  generate an enrolment-invite token
- `POST .../mfa/enrol-invite` (admin, `write UserMfa`) — issue a time-limited
  enrolment token for a user; `POST .../mfa/enrol-invite/redeem` — token-scoped
  session that lets the user self-run `register-finish` / TOTP `confirm` on their
  own device (reuses the `OneTimeLogin` pattern)

## Libraries

All actively maintained as of mid-2026; hosted/SaaS auth providers are ruled out
(external dependency at login breaks offline/facility operation and raises
data-residency concerns).

- **WebAuthn server: `@simplewebauthn/server`** (v13.x). De-facto standard,
  TS-first, verification-primitives (not a flow) so we keep control of the
  central/facility ceremony routing. `verifyAuthenticationResponse` takes
  `expectedRPID` / `expectedOrigin` as arrays or predicates — exactly what the
  shared-RP-ID-across-many-origins model needs. v13 is rearchitected onto
  WebCrypto/`Uint8Array` (no Node `Buffer`), so it runs on central, facility, and
  RN unchanged. Pass `0` as the stored counter (we don't track it).
- **WebAuthn web client: `@simplewebauthn/browser`** (v13.x). Matching pair;
  handles the base64url ⇄ ArrayBuffer encoding that is the main footgun. No
  React-specific wrapper — imperative calls inside the existing login action.
- **TOTP: `otpauth`** (v9.x, decided over `otplib`) — zero-dependency,
  isomorphic, TS-native, emits the `otpauth://` URI. (`otplib` v13 was the
  heavier alternative; `speakeasy` is unmaintained — avoid.)
- **QR rendering: existing `qrcode`** (already a dep) — render the `otpauth://`
  URI client-side. No new dependency.
- **Mobile TOTP**: no new mobile-specific lib — the `otpauth://` URI from
  `otpauth` is rendered as a QR on the client; verification is central-side.
  (Native-passkey lib `react-native-passkey` is covered in the mobile WebAuthn
  plan, not this effort.)

New runtime deps for this effort: the two `@simplewebauthn` packages and
`otpauth`. `qrcode` and `jose` (JWT) are already present.

## Mobile (TOTP in scope; WebAuthn split out)

Mobile only ever authenticates to **central**, and one build serves **many
deployments** (manual/version-bound download, not an app-store app; the app
fetches the deployment list from `meta.tamanu.app` and the user picks via
`ServerSelector`). Central is the sole verifier — no facility-forwarding or
sync-down dimension.

- **Mobile TOTP — in scope here.** Verification is central-only/online anyway, so
  it is exactly the web flow on the mobile client: the login screen gains a TOTP
  code step after the password, posting to central; enrolment uses the same
  central `enrol`/`confirm` (render the `otpauth://` URI as a QR / show the
  secret). An MFA-required user logging in on mobile with no factor is
  force-enrolled into **TOTP** (online); offline-first-login with no factor hard
  blocks, as with out-of-zone facilities.
- **Mobile WebAuthn — separate plan.** Native passkeys need an associated-domain
  setup that the single runtime-configured app build can't satisfy per
  deployment; see `docs/plans/mfa-mobile-webauthn.md`. Not built in this effort.

## Testing

Each PR lands with its tests; layered per the repo's testing rules
(`endpoint-integration-tests.md`, `playwright-e2e.md`).

- **Unit** — the enforcement **policy function** is pure-ish and high-value:
  matrix over feature flag × user factors / `require Mfa` × factor availability
  (`totp.availability` × WebAuthn-available-here) × IP zone × auth method. Also
  the RP-ID suffix predicate (incl. the `evilfoo.bar.com` non-match) and CIDR
  matching (IPv4/IPv6/v4-mapped).
- **Integration** (central + facility endpoint tests) — ceremony endpoints
  (register/assert begin+finish, TOTP enrol/confirm/verify); permission
  enforcement (`write Mfa`, `UserMfa`, `require Mfa`); feature-flag-off leaves
  login unchanged; `off` rejects passwordless assertions and `fallbackOnly`
  rejects TOTP on a WebAuthn-capable surface; facility forwards TOTP to central;
  invite-token redeem **requires token + password** and is single-use/expiring.
- **E2E** (Playwright, critical journeys) — **self-service** enrolment via the
  kebab modal for a *non-required* user (`write Mfa`, no `require Mfa`): enrol
  a passkey, log out, get **challenged** on the next login and complete it —
  and the same journey for TOTP. This covers the non-forced flows end to end;
  having no UI to drive would fail these specs, which is exactly the point.
  Plus: forced-enrolment interstitial (passkey-first) for a required user;
  factor removal; passwordless (usernameless, UV) login (PR2); admin reset;
  feature-flag-off path.

WebAuthn in Playwright uses the **Chromium CDP virtual authenticator**
(`WebAuthn.addVirtualAuthenticator`) behind a fixture — it answers the real
`navigator.credentials` calls, so the actual UI is exercised, not mocked. Set
`hasResidentKey` + `hasUserVerification` + `isUserVerified` to cover
usernameless/UV/passwordless, and `automaticPresenceSimulation` for unattended
runs. **Chromium-only** (the e2e project already runs Chromium). TOTP needs no
browser support — the test computes codes with `otpauth` from the enrolment
secret. **Cross-device hybrid (QR/phone) is not E2E-testable** (real devices +
Apple/Google relay) — cover it manually.

## Out of scope / excluded

- **Delegated/IdP WebAuthn.** Not building it. Out-of-zone facilities offer no
  WebAuthn and fall back to TOTP/password.
- **Patient portal MFA** — explicitly **excluded** (separate auth surface,
  `packages/central-server/app/patientPortalApi/auth/`).
- **Mobile native passkeys** — planned separately
  (`docs/plans/mfa-mobile-webauthn.md`), not built here.

## Build sequence

Three sequenced PRs in one effort (nothing deprioritised):

- **PR1 — core MFA.** `webauthn_credentials`, `totp_secrets`, ephemeral
  challenge tables (+ mobile TypeORM migrations as needed); WebAuthn + TOTP
  enrol/verify endpoints; the two permissions + admin actions (reset,
  in-person hybrid-QR provision, and the **enrolment-invite token** for
  remote/async provisioning — reusing the `OneTimeLogin` pattern, redemption
  **requiring token + password**, short-lived/single-use); the
  `auth.mfa.enabled` feature flag and `auth.mfa.totp.availability`
  (`all|fallbackOnly|off`); and the enforcement **policy function** built to take
  factor-availability, IP-zone, and auth-method inputs (IP-zone/passwordless
  stubbed until PR2/PR3).
- **PR2 — passwordless (B).** No-password `assert-begin/finish`,
  `residentKey: 'preferred'` + `userVerification: 'required'`, the
  `auth.mfa.passwordless` setting (`off | onRequest | promoted`; `promoted` uses
  conditional-UI autofill); passkey assertion feeds the policy function as
  fully-authenticating.
- **PR3 — IP policy (A).** `auth.ipAllowlist` (login gate) + `auth.mfa.ipExempt`
  (MFA exemption) settings, CIDR matching on `req.ip`; feeds the policy function.

## Resolved decisions

1. **Offline stance** — no downgrade. Rely on WebAuthn where available; hard
   block only at out-of-zone + offline facilities (inherent). See Enforcement.
2. **No recovery codes** — recovery is admin reset; admin-of-admin lockout goes
   to tech support with out-of-band checks. Adds admin reset + provisioning
   (the `UserMfa` permissions).
3. **Permissions** — split nouns: `write Mfa` (own), `require Mfa` (enforcement
   flag), `read`/`write UserMfa` (admin). See Permissions.
4. **TOTP encryption** — reuse the existing `encryptSecret`/`crypto.settingsPsk`
   mechanism; central-only storage (not the key) provides the blast-radius
   protection. No new key.
5. **Enforcement UX** — forced-enrolment interstitial; hard block only when
   neither factor can complete (out-of-zone + offline). Leads with passkey, TOTP
   as the alternative; skippable on an exempt network.
6. **Sequencing** — core first, then passwordless (B), then IP policy (A); see
   Build sequence.
7. **TOTP library** — `otpauth` (over `otplib`).
8. **Passwordless UX** — usernameless with `residentKey: 'preferred'` +
   `userVerification: 'required'`, graceful username-first fallback.
9. **Passwordless gate** — global `auth.mfa.passwordless` =
   `off | onRequest | promoted` (default `onRequest`). `off` rejects passwordless
   server-side; `onRequest` is opt-in per login; `promoted` uses conditional-UI
   autofill. Per-role refinement deferred.
10. **IP policy storage** — synced settings; `auth.ipAllowlist` (login-level) +
    `auth.mfa.ipExempt` (MFA). Client IP via existing `config.proxy.trusted` +
    `req.ip`, fail-closed.
11. **Exempt + `require Mfa`** — hybrid: interstitial shown but skippable on an
    exempt network, mandatory off-network.
12. **Admin-driven enrolment & the invite token** — authorised by `write
    UserMfa`; the target user needs no MFA permission. The invite-token redeem
    **must** require token + password (never token alone) and be
    short-lived/single-use. Hybrid QR is in-person/synchronous only.
13. **TOTP availability** — `auth.mfa.totp.availability` = `all | fallbackOnly |
    off` (one enum subsumes on/off). `fallbackOnly` offers TOTP only where
    WebAuthn is unavailable (mobile + out-of-zone facilities), enforcing passkeys
    on capable surfaces without lockout (force-enrol covers the gap). Per-role
    TOTP gating deferred.
14. **Settings defaults** — feature **off** by default; a bare `enabled = true`
    is non-disruptive (nobody forced/challenged); security-sensitive lists default
    to safe (allowlist empty = no restriction, exempt empty = no one exempt); RP
    ID unset = WebAuthn off. Permission seeding: `write Mfa` to all roles,
    `UserMfa` to admins, `require Mfa` to none. See Settings & defaults.

All design decisions are settled. Remaining items are build-time UX/detail only
(e.g. exact interstitial copy and layout).

## Follow-ups

All addressed within this effort: the `mfa_login` pass is single-use (nonce in
`mfa_challenges`, consumed on successful completion), and the facility
`/mfa/login` forwarding routes have integration tests
(`facility-server/__tests__/apiv1/mfaLogin.test.js`). Nothing outstanding for
PR1 beyond the deferred future work (passwordless, IP policy, mobile native
passkeys — separate plans/PRs).
