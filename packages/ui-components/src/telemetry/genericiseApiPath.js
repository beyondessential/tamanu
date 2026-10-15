// spec: BTEL
// Turn a concrete API endpoint path into a generic route pattern plus the
// resolved path parameters, so request spans group by shape (the pattern) while
// still carrying the specific ids for drill-down. The api-client only knows the
// raw path, not its route definition, so segments are masked heuristically:
// anything that looks like an id (UUID, numeric, or a long opaque token) becomes
// a positional `:paramN`.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NUMERIC_RE = /^\d+$/;
// Opaque ids (e.g. a long base62 token). Length alone is not enough to tell one
// from a route word: `medicationRequests`, `labTestPanelRequests` and
// `invoice-price-lists` are all long, and masking those would corrupt `route`,
// the key every page is grouped by downstream. Route segments are words —
// camelCase or kebab-case — and essentially never carry a digit, so require one.
// A digitless slug id (a reference-data code such as `drug-paracetamol`) is
// therefore left in the route; that keeps a handful of extra patterns, which is
// a far smaller problem than fragmenting the common routes, and such codes are
// reference data rather than anything patient-identifying.
const OPAQUE_RE = /^(?=[A-Za-z0-9_-]{16,}$)[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*$/;

function looksLikeId(segment) {
  return UUID_RE.test(segment) || NUMERIC_RE.test(segment) || OPAQUE_RE.test(segment);
}

/**
 * @param {string} endpoint raw endpoint path, e.g. 'encounter/abc-123/notes'
 * @returns {{ route: string, pathParams: Record<string, string> }}
 */
export function genericiseApiPath(endpoint) {
  const [rawPath] = String(endpoint ?? '').split('?');
  const leading = rawPath.startsWith('/') ? '/' : '';
  const segments = rawPath.replace(/^\/+/, '').split('/');

  const pathParams = {};
  let paramIndex = 0;
  const maskedSegments = segments.map(segment => {
    if (segment && looksLikeId(segment)) {
      paramIndex += 1;
      const name = `param${paramIndex}`;
      pathParams[name] = segment;
      return `:${name}`;
    }
    return segment;
  });

  return { route: `${leading}${maskedSegments.join('/')}`, pathParams };
}
