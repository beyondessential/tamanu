import React from 'react';
import PropTypes from 'prop-types';
import { TranslatedText } from './TranslatedText';

import { IS_DEVELOPMENT } from '../../utils/env';
import { getEnumPrefix, throwIfNotRegisteredEnum } from '@tamanu/shared/utils/enumRegistry';

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
        data-testid='translatedtext-t890' />
    );
  }

  const fallback = enumValues[value];
  const stringId = `${prefix}.${value}`;
  return (
    <TranslatedText
      stringId={stringId}
      fallback={fallback}
      {...restProps}
      data-testid='translatedtext-jmnd' />
  );
};

TranslatedEnum.propTypes = {
  value: PropTypes.string.isRequired,
  enumValues: PropTypes.object.isRequired,
};
