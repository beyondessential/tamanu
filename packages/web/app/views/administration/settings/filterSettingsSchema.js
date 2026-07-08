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
 * Returns a copy of `schema` containing only the settings matching `query`,
 * case-insensitively. Matches are tiered — name/path word-start, name/path
 * substring, description word-start, description substring — and only the best
 * populated tier is kept, so "age" finds "Age display format" without every
 * "page" mention, while "nation" still falls back to finding Vaccinations.
 * A group whose own name or path matches keeps its whole subtree. Keeps the
 * group structure above each match so results render with their category
 * headings. Returns null when nothing matches, and the schema unchanged for an
 * empty query. Copies rather than mutates: the scoped schema is a shared
 * singleton and mutating it corrupts every later schema walk.
 *
 * Kept nodes carry presentation flags for the results view (single source of
 * truth for match logic — the view never re-derives matches):
 * - `__exactMatch`: the query equals the node's whole display name; sorts first
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

  // Tiers: names/paths outrank descriptions, word-start matches outrank
  // substring-anywhere ones. Lower is better.
  const tierOf = (node, key, path) => {
    const name = displayName(node, key);
    if (atWordStart(name) || atWordStart(path)) return 1;
    if (anywhere(name) || anywhere(path)) return 2;
    if (atWordStart(node.description)) return 3;
    if (anywhere(node.description)) return 4;
    return NO_MATCH;
  };

  const isExact = (node, key) => normalise(displayName(node, key)) === needle;

  // Copies a kept node, attaching the presentation flags; groups kept whole
  // (own-name matches) recurse so nested exact/description hits still flag.
  const decorate = (node, key) => {
    const out = { ...node };
    if (!isSetting(node) && node.properties) {
      let hasExactMatch = false;
      const properties = {};
      for (const [childKey, child] of Object.entries(node.properties)) {
        const decorated = decorate(child, childKey);
        properties[childKey] = decorated;
        hasExactMatch ||= Boolean(decorated.__exactMatch || decorated.__hasExactMatch);
      }
      out.properties = properties;
      if (hasExactMatch) out.__hasExactMatch = true;
    }
    if (isExact(node, key)) out.__exactMatch = true;
    if (anywhere(node.description)) out.__matchedDescription = true;
    return out;
  };

  // Single analysis pass: each node's own tier plus the best tier in its
  // subtree, so the prune pass below can keep exactly the best populated tier
  // without re-walking the schema per tier.
  const analyse = (node, key, path) => {
    const own = tierOf(node, key, path);
    if (isSetting(node) || !node.properties) return { node, key, own, best: own };
    let best = own;
    const children = {};
    for (const [childKey, child] of Object.entries(node.properties)) {
      const analysed = analyse(child, childKey, path ? `${path}.${childKey}` : childKey);
      children[childKey] = analysed;
      if (analysed.best < best) best = analysed.best;
    }
    return { node, key, own, best, children };
  };

  const build = (analysed, targetTier) => {
    const { node, key, own, best, children } = analysed;
    if (own <= targetTier) return decorate(node, key);
    if (!children || best > targetTier) return null;
    const properties = {};
    let hasExactMatch = false;
    for (const [childKey, childAnalysed] of Object.entries(children)) {
      const kept = build(childAnalysed, targetTier);
      if (kept) {
        properties[childKey] = kept;
        hasExactMatch ||= Boolean(kept.__exactMatch || kept.__hasExactMatch);
      }
    }
    if (Object.keys(properties).length === 0) return null;
    const out = { ...node, properties };
    if (hasExactMatch) out.__hasExactMatch = true;
    return out;
  };

  // Analyse/prune the root's children directly rather than the root itself, so
  // a query matching some root-level name can't return the entire schema.
  const analysedChildren = Object.entries(schema.properties).map(([key, node]) => [
    key,
    analyse(node, key, key),
  ]);
  const targetTier = Math.min(...analysedChildren.map(([, analysed]) => analysed.best));
  if (targetTier === NO_MATCH) return null;

  const properties = {};
  for (const [key, analysed] of analysedChildren) {
    const kept = build(analysed, targetTier);
    if (kept) properties[key] = kept;
  }
  return { ...schema, properties };
};
