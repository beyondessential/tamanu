import { isPlainObject, isString } from 'es-toolkit/compat';
import { isSetting } from '@tamanu/settings/schema';

const JSON_EDITED_TYPES = ['array', 'object'];

// The JSON editor holds its value as raw text, so those settings arrive as
// strings and need parsing back before save. Only the schema can say which ones
// they are: sniffing for parseable text rewrites a string setting whose content
// happens to look like JSON.
export const parseJsonEditedSettings = (settings, schema) => {
  if (!isPlainObject(settings)) return settings;
  return Object.entries(settings).reduce((acc, [key, value]) => {
    const node = schema?.properties?.[key];
    if (!node || !isSetting(node)) {
      acc[key] = parseJsonEditedSettings(value, node);
      return acc;
    }
    if (!JSON_EDITED_TYPES.includes(node.type?.type) || !isString(value)) {
      acc[key] = value;
      return acc;
    }
    try {
      acc[key] = JSON.parse(value);
    } catch {
      acc[key] = value; // leave malformed text in place for validation to flag
    }
    return acc;
  }, {});
};
