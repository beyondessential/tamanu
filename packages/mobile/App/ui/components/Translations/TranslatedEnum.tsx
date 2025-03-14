import React from 'react';
import { TranslatedText } from './TranslatedText';
import { TranslatedTextProps } from '~/ui/contexts/TranslationContext';
import { getEnumPrefix } from './enumRegistry';

interface TranslatedEnumProps extends Partial<TranslatedTextProps>{
  value: string;
  enumValues: any;
  prefix?: string;
  enumFallback?: string;
}

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
  const stringId = `${prefix}.${value}`;
  return <TranslatedText stringId={stringId} fallback={fallback} {...restProps} />;
};
