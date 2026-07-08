import { capitalize, startCase } from 'es-toolkit/compat';
import { isSetting } from '@tamanu/settings/schema';

// Same display-name derivation as the editor rows (see formatSettingName).
const displayName = (node, key) => node.name || capitalize(startCase(key));

// Split camelCase so key paths expose word boundaries ("maxPageSize" ->
// "max page size"), then lowercase for case-insensitive comparison.
const normalise = text => text.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase();

const escapeRegExp = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Match only at word starts: "age" finds "Age display format" but not "page".
const matches = (needleRegExp, ...haystacks) =>
  haystacks.some(text => typeof text === 'string' && needleRegExp.test(normalise(text)));

/**
 * Whether `text` contains `query` (case-insensitive substring). Used by the
 * results view to show *why* a row matched (e.g. render the description when
 * the hit was in it, invisible otherwise) — substring on purpose, so it
 * explains rows from either matching tier.
 */
export const textMatchesQuery = (text, query) => {
  const needle = query?.trim().toLowerCase();
  if (!needle || typeof text !== 'string') return false;
  return text.toLowerCase().includes(needle);
};

/**
 * Returns a copy of `schema` containing only the settings matching `query`,
 * case-insensitively, in tiers (see below): display name and dotted key path
 * outrank description, word-start matches outrank substring ones. The results
 * view surfaces matched descriptions inline so a description hit is visible,
 * not baffling. Keeps the group structure above each match so results render
 * with their category headings. A group whose own name or path matches keeps its whole
 * subtree. Returns null when nothing matches, and the schema unchanged for an
 * empty query. Copies rather than mutates: the scoped schema is a shared
 * singleton and mutating it corrupts every later schema walk.
 */
export const filterSettingsSchema = (schema, query) => {
  const needle = normalise(query.trim());
  if (!needle) return schema;

  const filterWith = (needleRegExp, includeDescriptions) => {
    const filterNode = (node, key, path) => {
      const haystacks = [displayName(node, key), path];
      if (includeDescriptions) haystacks.push(node.description);
      if (matches(needleRegExp, ...haystacks)) return node;
      if (isSetting(node) || !node.properties) return null;
      const properties = {};
      for (const [childKey, child] of Object.entries(node.properties)) {
        const kept = filterNode(child, childKey, path ? `${path}.${childKey}` : childKey);
        if (kept) properties[childKey] = kept;
      }
      if (Object.keys(properties).length === 0) return null;
      return { ...node, properties };
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

  // Tiered matching, first non-empty tier wins: names/paths outrank
  // descriptions, and word-start matches ("age" finds "Age display format" but
  // not "page") outrank substring-anywhere ones ("nation" -> vaccination).
  const wordStart = new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(needle)}`);
  const anywhere = new RegExp(escapeRegExp(needle));
  return (
    filterWith(wordStart, false) ??
    filterWith(anywhere, false) ??
    filterWith(wordStart, true) ??
    filterWith(anywhere, true)
  );
};
