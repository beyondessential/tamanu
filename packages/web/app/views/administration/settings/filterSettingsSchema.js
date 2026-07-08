import { capitalize, startCase } from 'es-toolkit/compat';
import { isSetting } from '@tamanu/settings/schema';

// Same display-name derivation as the editor rows (see formatSettingName).
const displayName = (node, key) => node.name || capitalize(startCase(key));

const matches = (needle, ...haystacks) =>
  haystacks.some(text => typeof text === 'string' && text.toLowerCase().includes(needle));

/**
 * Returns a copy of `schema` containing only the settings matching `query`
 * (case-insensitive, against display name, dotted key path, and description),
 * keeping the group structure above each match so results render with their
 * category headings. A group whose own name or path matches keeps its whole
 * subtree. Returns null when nothing matches, and the schema unchanged for an
 * empty query. Copies rather than mutates: the scoped schema is a shared
 * singleton and mutating it corrupts every later schema walk.
 */
export const filterSettingsSchema = (schema, query) => {
  const needle = query.trim().toLowerCase();
  if (!needle) return schema;

  const filterNode = (node, key, path) => {
    if (matches(needle, displayName(node, key), path, node.description)) return node;
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
