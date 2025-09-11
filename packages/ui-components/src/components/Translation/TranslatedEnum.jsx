import React from 'react';
import PropTypes from 'prop-types';
import { TranslatedText } from './TranslatedText';
import { IS_DEVELOPMENT } from '../../utils/env';
import {
  getEnumPrefix,
  throwIfNotRegisteredEnum,
  toCamelCase,
} from '@tamanu/shared/utils/enumRegistry';

export const TranslatedEnum = ({ value, enumValues, enumFallback = 'Unknown', ...restProps }) => {
  if (IS_DEVELOPMENT) {
    throwIfNotRegisteredEnum(enumValues);
  }
  const prefix = getEnumPrefix(enumValues);
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
  // convert the enum value to a string id
  const camelCaseValue = toCamelCase(value);
  const stringId = `${prefix}.${camelCaseValue}`;
  return (
    <TranslatedText
      stringId={stringId}
      fallback={fallback}
      {...restProps}
      data-testid="translatedtext-buer"
    />
  );
};

TranslatedEnum.propTypes = {
  value: PropTypes.string.isRequired,
  enumValues: PropTypes.object.isRequired,
};
