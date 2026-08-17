// spec: IDEM
//
// The one place that records which parts of the facility API sit outside request
// idempotency, and why. Idempotency is opt-out by design: the middleware is
// mounted across apiv1, so a new endpoint is covered the moment it is added, and
// a gap can only be created deliberately by adding an entry here.
//
// `__tests__/apiv1/idempotencyPolicy.test.js` enforces that: it walks the real
// router and fails when a mutating endpoint appears that no entry below accounts
// for. That is what stops a gap from being opened by accident months from now.

/**
 * Paths that opt out of idempotent handling even when a request carries a key.
 * `samplePath` is a concrete path the pattern must match — it keeps the regex
 * honest and gives the test something to check drift against.
 */
export const IDEMPOTENCY_EXCLUSIONS = [
  {
    pattern: /^\/refresh$/,
    samplePath: '/refresh',
    reason:
      'Token-issuing: each call must mint a fresh token, so replaying a recorded response would hand back a stale one.',
  },
  {
    pattern: /^\/setFacility$/,
    samplePath: '/setFacility',
    reason: 'Token-issuing: re-scopes the session token, so it must run every time.',
  },
  {
    pattern: /^\/admin(\/|$)/,
    samplePath: '/admin/settings/cache',
    reason:
      'Administrative operations act on server state rather than clinical records; replaying a cached outcome would hide whether the operation actually ran.',
  },
  {
    pattern: /^\/sync(\/|$)/,
    samplePath: '/sync/run',
    reason:
      'Sync is a long-running streaming protocol with its own resumption model, and is already replay-safe.',
  },
  {
    pattern: /^\/syncHealth(\/|$)/,
    samplePath: '/syncHealth',
    reason: 'Reports live sync state; a replayed answer would be misleading.',
  },
  {
    pattern: /^\/patientFacility(\/|$)/,
    samplePath: '/patientFacility',
    reason: 'Part of the sync surface, marking patients for sync rather than recording clinical data.',
  },
  {
    pattern: /^\/ai(\/|$)/,
    samplePath: '/ai/summary',
    reason:
      'Streams a response from an external model, so it cannot be buffered and replayed by the wrapping transaction.',
  },
  {
    pattern: /^\/invoices\/[^/]+\/finalise$/,
    samplePath: '/invoices/abc-123/finalise',
    reason:
      'Uses an unmanaged transaction with an explicit commit(), which the single wrapping transaction cannot cover. Migrate it to a managed transaction (see llm/project-rules/sequelize-transactions.md) and remove this entry.',
  },
  {
    pattern: /^\/invoices\/[^/]+\/insurancePlans$/,
    samplePath: '/invoices/abc-123/insurancePlans',
    reason:
      'Uses an unmanaged transaction with an explicit commit(), which the single wrapping transaction cannot cover. Migrate it to a managed transaction (see llm/project-rules/sequelize-transactions.md) and remove this entry.',
  },
];

export const IDEMPOTENCY_EXCLUDED_PATHS = IDEMPOTENCY_EXCLUSIONS.map(({ pattern }) => pattern);

/**
 * Mutating endpoints registered before the idempotency middleware, which
 * therefore never reach it. These all run before authentication, and a key is
 * scoped to a user and facility, so there is nothing to scope one to yet.
 *
 * Adding a mutating endpoint above the middleware without adding it here fails
 * the policy test.
 */
export const PRE_IDEMPOTENCY_MUTATING_ROUTES = [
  {
    path: '/login',
    reason: 'Unauthenticated and token-issuing: it establishes the user a key would be scoped to.',
  },
  {
    path: '/resetPassword',
    reason: 'Unauthenticated; triggers an out-of-band email rather than writing a clinical record.',
  },
  {
    path: '/changePassword',
    reason: 'Unauthenticated (completes a reset with a one-time token).',
  },
  {
    path: '/public/setup/sync',
    reason: 'First-run setup, before the server has any users or facilities to scope a key to.',
  },
  {
    path: '/public/browser-support',
    reason: 'Unauthenticated pre-login gate; computes a verdict from the posted descriptor and stores nothing.',
  },
];

/**
 * Route files permitted to use an unmanaged transaction (`db.transaction()` with
 * an explicit `commit()`). That pattern is incompatible with the middleware's
 * wrapping transaction, so each of these must also be excluded above.
 */
export const UNMANAGED_TRANSACTION_ROUTE_FILES = [
  'invoice/invoices.js',
  'invoice/insurancePlans.js',
];
