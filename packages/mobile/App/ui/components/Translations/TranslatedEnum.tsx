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
  const prefix = getEnumPrefix(enumValues);
  if (!enumValues[value]) {
    return (
      <TranslatedText stringId="general.fallback.unknown" fallback={enumFallback} {...restProps} />
    );
  }

  const fallback = enumValues[value];
  // convert the enum value to a string id
  const camelCaseValue = toCamelCase(value);
  const stringId = `${prefix}.${camelCaseValue}`;
  return <TranslatedText stringId={stringId} fallback={fallback} {...restProps} />;
};
