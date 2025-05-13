import { enumRegistry, prefixMap } from '@tamanu/constants';

/**
 * Converts a string from formats like SNAKE_CASE to camelCase
 * @param {string} value - The string to convert
 * @returns {string} The converted string in camelCase
 */
export const toCamelCase = value => {
  return value
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase());
};

/**
 * Used to enforce usage of translatable enums
 * recognises registered enums from object references
 */
export const isRegisteredEnum = enumValues => enumRegistry.has(enumValues);

/** Get the translation prefix from an object reference to a registered enum */
export const getEnumPrefix = enumValues => prefixMap.get(enumValues);

export const throwIfNotRegisteredEnum = (enumValues, fieldName) => {
  if (!isRegisteredEnum(enumValues)) {
    throw new Error(
      `enumValues for ${
        fieldName ? `for field ${fieldName} ` : ''
      }are not registered in enumRegistry: ${JSON.stringify(enumValues)} `,
    );
  }
  if (!getEnumPrefix(enumValues)) {
    throw new Error(
      `enumValues for ${
        fieldName ? `for field ${fieldName} ` : ''
      }has no associated prefix: ${JSON.stringify(enumValues)}`,
    );
  }
};
