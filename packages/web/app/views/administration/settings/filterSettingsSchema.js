import { capitalize, startCase } from 'es-toolkit/compat';
import { isSetting } from '@tamanu/settings/schema';

// Same display-name derivation as the editor rows (see formatSettingName).
const displayName = (node, key) => node.name || capitalize(startCase(key));

// Split camelCase so key paths expose word boundaries ("maxPageSize" ->
// "max page size"), then lowercase for case-insensitive comparison.
const normalise = text => text.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase();

export const escapeRegExp = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const NO_MATCH = Infinity;

/**
 * Filters `schema` to the settings matching `query`, case-insensitively.
 * Rank-don't-hide: nothing that matches is dropped; instead every kept node
 * gets match metadata the results view sorts by, so strong matches lead and
 * weak ones sink instead of vanishing. Tiers, best first: setting name/path
 * before category name/path before description (leaf-only — group descriptions
 * are invisible in results), and word-start matches ("age" → "Age display
 * format", never "page") before substring-anywhere ones ("nation" →
 * Vaccinations). A group whose own name or path matches keeps its whole
 * subtree, and the group structure above each match is kept so results render
 * with their category headings.
 *
 * Returns `{ schema, meta }` — a filtered copy plus a WeakMap from its nodes to
 * `{ tier, exact, hasExact, matchedDescription }`:
 * - `tier`: the node's best tier (own or descendant); lower sorts first
 * - `exact`: the query equals the node's whole display name; sorts before
 *   everything
 * - `hasExact`: a group holding an exact match somewhere below
 * - `matchedDescription`: the description contains the query, so the view
 *   surfaces it inline (a tooltip-only hit reads as an inexplicable result)
 * Keeping metadata out of the schema nodes means the domain shape never grows
 * presentation fields, and unfiltered schemas can't carry stale flags.
 *
 * Returns null when nothing matches, and the schema unchanged (empty meta) for
 * an empty query. Copies rather than mutates: the scoped schema is a shared
 * singleton and mutating it corrupts every later schema walk.
 */
export const filterSettingsSchema = (schema, query) => {
  const meta = new WeakMap();
  const needle = normalise(query.trim());
  if (!needle) return { schema, meta };

  const wordStart = new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(needle)}`);
  const atWordStart = text => typeof text === 'string' && wordStart.test(normalise(text));
  const anywhere = text => typeof text === 'string' && normalise(text).includes(needle);

  const tierOf = (node, key, path) => {
    const isLeaf = isSetting(node) || !node.properties;
    const name = displayName(node, key);
    if (atWordStart(name) || atWordStart(path)) return isLeaf ? 1 : 3;
    if (anywhere(name) || anywhere(path)) return isLeaf ? 2 : 4;
    // Description tiers are leaf-only: a group's description is never shown in
    // the results, and a hit there would drag in its entire subtree of
    // non-matching settings with nothing visible to explain why.
    if (!isLeaf) return NO_MATCH;
    if (atWordStart(node.description)) return 5;
    if (anywhere(node.description)) return 6;
    return NO_MATCH;
  };

  const isExact = (node, key) => normalise(displayName(node, key)) === needle;

  const filterNode = (node, key, path) => {
    const own = tierOf(node, key, path);

    if (isSetting(node) || !node.properties) {
      if (own === NO_MATCH) return null;
      const out = { ...node };
      meta.set(out, {
        tier: own,
        exact: isExact(node, key),
        matchedDescription: anywhere(node.description),
      });
      return out;
    }

    const ownMatched = own !== NO_MATCH;
    const properties = {};
    let bestChild = NO_MATCH;
    let hasExact = false;
    for (const [childKey, child] of Object.entries(node.properties)) {
      // An own-matched group keeps its whole subtree: children that didn't
      // match themselves ride along as-is (they can't need metadata — an exact
      // or description hit would have made them match).
      const kept =
        filterNode(child, childKey, path ? `${path}.${childKey}` : childKey) ??
        (ownMatched ? child : null);
      if (kept) {
        properties[childKey] = kept;
        const childMeta = meta.get(kept);
        bestChild = Math.min(bestChild, childMeta?.tier ?? NO_MATCH);
        hasExact ||= Boolean(childMeta?.exact || childMeta?.hasExact);
      }
    }
    if (!ownMatched && Object.keys(properties).length === 0) return null;

    const out = { ...node, properties };
    meta.set(out, {
      tier: Math.min(own, bestChild),
      exact: isExact(node, key),
      hasExact,
    });
    return out;
  };

  // Filter the root's children directly rather than the root itself, so a
  // query matching some root-level name can't return the entire schema.
  const properties = {};
  for (const [key, node] of Object.entries(schema.properties)) {
    const kept = filterNode(node, key, key);
    if (kept) properties[key] = kept;
  }
  if (Object.keys(properties).length === 0) return null;
  return { schema: { ...schema, properties }, meta };
};
