import React from 'react';
import { TranslatedText } from './TranslatedText';
import { TranslatedTextProps } from '~/ui/contexts/TranslationContext';
import { getEnumPrefix } from './enumRegistry';

interface TranslatedEnumProps extends Partial<TranslatedTextProps> {
  value: string;
  enumValues: any;
  prefix?: string;
  enumFallback?: string;
}

export const getEnumStringId = (value, enumValues) => {
  const prefix = getEnumPrefix(enumValues);
  return `${prefix}.${toCamelCase(value)}`;
};

/**
 * Converts a string from formats like SNAKE_CASE to camelCase
 * Keep in sync with packages/shared/src/utils/enumRegistry.js
 * @param {string} value - The string to convert
 * @returns {string} The converted string in camelCase
 */
const toCamelCase = (value: string): string => {
  return value.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase());
};

export const TranslatedEnum = ({
  value,
  enumValues,
  enumFallback = 'Unknown',
  ...restProps
}: TranslatedEnumProps) => {
  if (!enumValues[value]) {
    return (
      <TranslatedText stringId="general.fallback.unknown" fallback={enumFallback} {...restProps} />
    );
  }

  const stringId = getEnumStringId(value, enumValues);
  const fallback = enumValues[value];
  return <TranslatedText stringId={stringId} fallback={fallback} {...restProps} />;
};
