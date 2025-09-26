import React from 'react';
import { TranslatedText } from './TranslatedText';
import { IS_DEVELOPMENT } from '../../utils/env';
import {
  getEnumPrefix,
  throwIfNotRegisteredEnum,
  toCamelCase,
} from '@tamanu/shared/utils/enumRegistry';

export const getEnumStringId = (value, enumValues) => {
  const prefix = getEnumPrefix(enumValues);
  return `${prefix}.${toCamelCase(value)}`;
};

export const TranslatedEnum = ({ value, enumValues, enumFallback = 'Unknown', ...restProps }) => {
  if (IS_DEVELOPMENT) {
    throwIfNotRegisteredEnum(enumValues);
  }
  if (!enumValues[value]) {
    return (
      <TranslatedText
        stringId="general.fallback.unknown"
        fallback={enumFallback}
        {...restProps}
        data-testid="translatedtext-h109"
      />
    );
  }

  const fallback = enumValues[value];
  const stringId = getEnumStringId(value, enumValues);
  return (
    <TranslatedText
      stringId={stringId}
      fallback={fallback}
      {...restProps}
      data-testid="translatedtext-buer"
    />
  );
};
