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
  return `${prefix}.${value}`;
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
