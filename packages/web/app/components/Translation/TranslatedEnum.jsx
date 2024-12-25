import React from 'react';
import PropTypes from 'prop-types';
import { TranslatedText } from './TranslatedText';

import { IS_DEVELOPMENT } from '../../utils/env';
import { getEnumPrefix, throwIfNotRegisteredEnum } from '@tamanu/utils/enumRegistry';

export const TranslatedEnum = ({ value, enumValues, enumFallback = 'Unknown' }) => {
  if (IS_DEVELOPMENT) {
    throwIfNotRegisteredEnum(enumValues);
  }
  const prefix = getEnumPrefix(enumValues);
  if (!enumValues[value]) {
    return <TranslatedText stringId="general.fallback.unknown" fallback={enumFallback} />;
  }

  const fallback = enumValues[value];
  const stringId = `${prefix}.${value}`;
  return <TranslatedText stringId={stringId} fallback={fallback} />;
};

TranslatedEnum.propTypes = {
  value: PropTypes.string.isRequired,
  enumValues: PropTypes.object.isRequired,
};
