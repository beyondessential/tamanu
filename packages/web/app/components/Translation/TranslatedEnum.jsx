import React from 'react';
import PropTypes from 'prop-types';
import { enumRegistry } from '@tamanu/constants';
import { TranslatedText } from './TranslatedText.jsx';

export const TranslatedEnum = ({ prefix, value, enumValues, enumFallback = 'Unknown' }) => {
  if (!enumRegistry.has(enumValues))
    throw new Error(
      'enumValues prop must be a constant registered within enumRegistry in @tamanu/constants',
    );

  if (!enumValues[value]) {
    return <TranslatedText stringId="general.fallback.unknown" fallback={enumFallback} />;
  }

  const fallback = enumValues[value];
  const stringId = `${prefix}.${value}`;
  return <TranslatedText stringId={stringId} fallback={fallback} />;
};

TranslatedEnum.propTypes = {
  prefix: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  enumValues: PropTypes.object.isRequired,
};
