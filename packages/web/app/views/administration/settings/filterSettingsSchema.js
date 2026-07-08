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
 * Filters `schema` to the settings matching `query`, case-insensitively,
 * keeping the group structure above each match. Rank-don't-hide: every match
 * is kept and tiered (setting name/path > category name/path > description,
 * word-start > substring) so the view sorts strong matches first instead of
 * hiding weak ones. A group whose own name or path matches keeps its whole
 * subtree.
 *
 * Returns `{ schema, meta }`: a filtered copy plus a WeakMap from its nodes to
 * `{ tier, exact, hasExact, matchedDescription }` — kept out of the schema so
 * the domain shape never grows presentation fields. Null when nothing matches;
 * the schema unchanged for an empty query. Copies rather than mutates: the
 * scoped schema is a shared singleton.
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
    // leaf-only: group descriptions are never shown, and a hit there would
    // drag in a whole subtree with nothing visible to explain why
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
      // an own-matched group keeps its whole subtree; non-matching children
      // ride along as-is (a hit would have made them match)
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
