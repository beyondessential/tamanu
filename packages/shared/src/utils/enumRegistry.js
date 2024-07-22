import { enumRegistry, prefixMap } from '@tamanu/constants';

/**
 * Used to enforce usage of translatable enums
 * recognises registered enums from object references
 */
export const isRegisteredEnum = enumValues => enumRegistry.has(enumValues);

/** Get the translation prefix from an object reference to a registered enum */
export const getEnumPrefix = enumValues => prefixMap.get(enumValues);

