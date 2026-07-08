import { capitalize, startCase } from 'es-toolkit/compat';
import { isSetting } from '@tamanu/settings/schema';

// Same display-name derivation as the editor rows (see formatSettingName).
const displayName = (node, key) => node.name || capitalize(startCase(key));

// Split camelCase so key paths expose word boundaries ("maxPageSize" ->
// "max page size"), then lowercase for case-insensitive comparison.
const normalise = text => text.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase();

const escapeRegExp = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const NO_MATCH = Infinity;

/**
 * Returns a copy of `schema` containing every setting matching `query`,
 * case-insensitively. Rank-don't-hide: nothing that matches is dropped;
 * instead each kept node carries a match tier the results view sorts by, so
 * strong matches lead and weak ones sink instead of vanishing. Tiers, best
 * first: setting name/path before category name/path before description, and
 * word-start matches ("age" → "Age display format", never "page") before
 * substring-anywhere ones ("nation" → Vaccinations). A group whose own name or
 * path matches keeps its whole subtree, and the group structure above each
 * match is kept so results render with their category headings. Returns null
 * when nothing matches, and the schema unchanged for an empty query. Copies
 * rather than mutates: the scoped schema is a shared singleton and mutating it
 * corrupts every later schema walk.
 *
 * Presentation flags on kept nodes (single source of truth for match logic —
 * the view never re-derives matches):
 * - `__matchTier`: the node's best tier (own or descendant); lower sorts first
 * - `__exactMatch`: the query equals the node's whole display name; sorts
 *   before everything
 * - `__hasExactMatch`: a group holding an exact match somewhere below
 * - `__matchedDescription`: the description contains the query, so the view
 *   surfaces it inline (a tooltip-only hit reads as an inexplicable result)
 */
export const filterSettingsSchema = (schema, query) => {
  const needle = normalise(query.trim());
  if (!needle) return schema;

  const wordStart = new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(needle)}`);
  const atWordStart = text => typeof text === 'string' && wordStart.test(normalise(text));
  const anywhere = text => typeof text === 'string' && normalise(text).includes(needle);

  // Tiers, lower is better: setting names outrank category names outrank
  // descriptions, and within each, word-start matches outrank
  // substring-anywhere ones. Leaf paths carry their category prefix, so a
  // category hit usually surfaces its settings at the name tiers anyway; the
  // category tiers matter when only the category's display name matches.
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
      const out = { ...node, __matchTier: own };
      if (isExact(node, key)) out.__exactMatch = true;
      if (anywhere(node.description)) out.__matchedDescription = true;
      return out;
    }

    const ownMatched = own !== NO_MATCH;
    const properties = {};
    let bestChild = NO_MATCH;
    let hasExactMatch = false;
    for (const [childKey, child] of Object.entries(node.properties)) {
      // An own-matched group keeps its whole subtree: children that didn't
      // match themselves ride along as-is (they can't need flags — an exact or
      // description hit would have made them match).
      const kept =
        filterNode(child, childKey, path ? `${path}.${childKey}` : childKey) ??
        (ownMatched ? child : null);
      if (kept) {
        properties[childKey] = kept;
        bestChild = Math.min(bestChild, kept.__matchTier ?? NO_MATCH);
        hasExactMatch ||= Boolean(kept.__exactMatch || kept.__hasExactMatch);
      }
    }
    if (!ownMatched && Object.keys(properties).length === 0) return null;

    const out = { ...node, properties, __matchTier: Math.min(own, bestChild) };
    if (hasExactMatch) out.__hasExactMatch = true;
    if (isExact(node, key)) out.__exactMatch = true;
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
  return { ...schema, properties };
};
