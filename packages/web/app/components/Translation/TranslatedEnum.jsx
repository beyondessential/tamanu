import React from 'react';
import PropTypes from 'prop-types';
import { isRegisteredEnum, getEnumPrefix } from '@tamanu/constants';
import { TranslatedText } from './TranslatedText.jsx';
import { IS_DEVELOPMENT } from '../../utils/env';

export const TranslatedEnum = ({ value, enumValues, enumFallback = 'Unknown' }) => {
  if (IS_DEVELOPMENT && !isRegisteredEnum(enumValues))
    throw new Error(
      'enumValues prop must be a constant registered within enumRegistry in @tamanu/constants',
    );

  if (!enumValues[value]) {
    return <TranslatedText stringId="general.fallback.unknown" fallback={enumFallback} />;
  }

  const prefix = getEnumPrefix(enumValues);
  const fallback = enumValues[value];
  const stringId = `${prefix}.${value}`;
  return <TranslatedText stringId={stringId} fallback={fallback} />;
};

TranslatedEnum.propTypes = {
  prefix: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  enumValues: PropTypes.object.isRequired,
};
