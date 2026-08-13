import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import { createApiv1 } from '../../app/routes/apiv1';
import { createRoutes } from '../../app/routes';
import {
  IDEMPOTENCY_EXCLUSIONS,
  PRE_IDEMPOTENCY_MUTATING_ROUTES,
  UNMANAGED_TRANSACTION_ROUTE_FILES,
} from '../../app/routes/apiv1/idempotencyPolicy';

// spec: IDEM
//
// The policy guard. Request idempotency is opt-out: the middleware covers every
// endpoint registered after it, so the only ways an endpoint can end up
// uncovered are to be registered above the middleware, to be mounted outside
// apiv1, or to match an exclusion. This file pins all three, so a gap opened
// months from now fails here instead of shipping silently.
//
// None of these assertions grow as ordinary endpoints are added — a new mutating
// endpoint under apiv1 is simply covered, and needs no change here.

const MUTATING_METHODS = ['post', 'put', 'patch', 'delete'];
const ROUTES_DIR = join(import.meta.dirname ?? __dirname, '../../app/routes/apiv1');

const matchesPath = (layer, path) =>
  (layer.matchers ?? []).some(matcher => {
    try {
      return Boolean(matcher(path));
    } catch {
      return false;
    }
  });

const routeIsMutating = layer => Object.keys(layer.route?.methods ?? {}).some(m => MUTATING_METHODS.includes(m));

// A sub-router counts as mutating if anything inside it is.
const routerHasMutatingRoute = layer => {
  const stack = layer.handle?.stack;
  if (!Array.isArray(stack)) return false;
  return stack.some(inner =>
    inner.route ? routeIsMutating(inner) : routerHasMutatingRoute(inner),
  );
};

const listFilesRecursively = dir =>
  readdirSync(dir).flatMap(entry => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? listFilesRecursively(full) : [full];
  });

describe('Request idempotency policy', () => {
  let apiv1;
  let idempotencyIndex;

  beforeAll(() => {
    apiv1 = createApiv1({});
    idempotencyIndex = apiv1.stack.findIndex(layer => layer.name === 'requestIdempotency');
  });

  it('mounts the idempotency middleware', () => {
    // If this fails, every endpoint below silently lost its idempotency.
    expect(idempotencyIndex).toBeGreaterThanOrEqual(0);
  });

  it('accounts for every mutating endpoint registered above the middleware', () => {
    const unaccounted = apiv1.stack.slice(0, idempotencyIndex).flatMap((layer, index) => {
      const isMutating = layer.route ? routeIsMutating(layer) : routerHasMutatingRoute(layer);
      if (!isMutating) return [];

      const accounted = PRE_IDEMPOTENCY_MUTATING_ROUTES.some(entry =>
        layer.route ? layer.route.path === entry.path : matchesPath(layer, entry.path),
      );
      if (accounted) return [];

      return [layer.route ? `${layer.route.path} (layer ${index})` : `sub-router at layer ${index}`];
    });

    expect(
      unaccounted,
      `Mutating endpoint(s) registered above the idempotency middleware and so not covered by it.
Either move the registration below the middleware (the usual fix — it then gets idempotency for free),
or, if it genuinely cannot be covered, add it to PRE_IDEMPOTENCY_MUTATING_ROUTES in
app/routes/apiv1/idempotencyPolicy.js with the reason.`,
    ).toEqual([]);
  });

  it('has no stale entries in the pre-middleware allowlist', () => {
    const stale = PRE_IDEMPOTENCY_MUTATING_ROUTES.filter(
      entry =>
        !apiv1.stack
          .slice(0, idempotencyIndex)
          .some(layer => (layer.route ? layer.route.path === entry.path : matchesPath(layer, entry.path))),
    ).map(entry => entry.path);

    expect(
      stale,
      'These paths are listed as uncovered but no longer exist above the middleware — remove them from PRE_IDEMPOTENCY_MUTATING_ROUTES.',
    ).toEqual([]);
  });

  it('keeps every exclusion documented and matching its sample path', () => {
    for (const { pattern, samplePath, reason } of IDEMPOTENCY_EXCLUSIONS) {
      expect(reason?.trim(), `Exclusion ${pattern} needs a reason`).toBeTruthy();
      expect(
        pattern.test(samplePath),
        `Exclusion ${pattern} no longer matches its own sample path ${samplePath}`,
      ).toBe(true);
    }
  });

  it('keeps exclusions narrow enough to leave the clinical surface covered', () => {
    // An over-broad pattern (say /^\/a/) would silently drop a swathe of
    // endpoints out of idempotency while still looking deliberate. These are
    // representative of the data-entry surface the feature exists to protect.
    const mustStayCovered = [
      '/allergy',
      '/patient',
      '/patient/123/issues',
      '/encounter',
      '/encounter/123/notes',
      '/medication',
      '/labRequest',
      '/imagingRequest',
      '/appointments',
      '/surveyResponse',
      '/triage',
      '/vitals',
      '/procedure',
      '/referral',
      '/invoices',
      '/invoices/abc-123',
    ];

    const wronglyExcluded = mustStayCovered.flatMap(path => {
      const hit = IDEMPOTENCY_EXCLUSIONS.find(({ pattern }) => pattern.test(path));
      return hit ? [`${path} excluded by ${hit.pattern}`] : [];
    });

    expect(
      wronglyExcluded,
      'An exclusion pattern is broad enough to cover clinical endpoints that should keep idempotent handling. Tighten the pattern.',
    ).toEqual([]);
  });

  it('mounts nothing outside apiv1 that could take mutating traffic', () => {
    // Anything mounted on the top-level router rather than inside apiv1 bypasses
    // the middleware entirely, so the shape of this router is pinned.
    const routes = createRoutes({});
    const mountedRouters = routes.stack.filter(layer => layer.name === 'router');

    // Both mounts are the same apiv1 router (/api and its legacy /v1 alias).
    expect(mountedRouters).toHaveLength(2);
    for (const layer of mountedRouters) {
      const mountsApi = matchesPath(layer, '/api') || matchesPath(layer, '/v1');
      expect(
        mountsApi,
        'A router is mounted outside apiv1, so its endpoints never reach the idempotency middleware. Mount it inside apiv1, or extend this test with the reason it is safe.',
      ).toBe(true);
    }
  });

  it('keeps unmanaged transactions confined to the endpoints excluded for them', () => {
    // An unmanaged transaction commits independently of the middleware's wrapping
    // transaction, so an endpoint using one cannot be covered safely. Any new
    // offender must be either migrated to a managed transaction or excluded.
    const offenders = listFilesRecursively(ROUTES_DIR)
      .filter(file => /\.[jt]s$/.test(file))
      .filter(file => {
        const source = readFileSync(file, 'utf8');
        // `db.transaction()` with no callback argument, paired with an explicit commit.
        return /\.transaction\(\s*\)/.test(source) && /\.commit\(\s*\)/.test(source);
      })
      .map(file => relative(ROUTES_DIR, file));

    expect(
      offenders.sort(),
      `Route file(s) using an unmanaged transaction. That pattern is not safe under the idempotency
wrapping transaction: migrate to a managed transaction (llm/project-rules/sequelize-transactions.md),
or exclude the endpoint in idempotencyPolicy.js and list the file in UNMANAGED_TRANSACTION_ROUTE_FILES.`,
    ).toEqual([...UNMANAGED_TRANSACTION_ROUTE_FILES].sort());
  });
});
