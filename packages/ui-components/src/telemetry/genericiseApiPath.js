// spec: BTEL
// Turn a concrete API endpoint path into a generic route pattern plus the
// resolved path parameters, so request spans group by shape (the pattern) while
// still carrying the specific ids for drill-down. The api-client only knows the
// raw path, not its route definition, so segments are masked heuristically:
// anything that looks like an id (UUID, numeric, or a long opaque token) becomes
// a positional `:paramN`.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NUMERIC_RE = /^\d+$/;
// Opaque reference-data style ids (e.g. a long base62 token) — long and not a word.
const OPAQUE_RE = /^[A-Za-z0-9_-]{16,}$/;

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
