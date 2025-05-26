import React from 'react';
import PropTypes from 'prop-types';
import { TranslatedText } from './TranslatedText';
import { REFERENCE_DATA_TRANSLATION_PREFIX } from '@tamanu/constants';

export const getReferenceDataStringId = (value, category) => {
  return `${REFERENCE_DATA_TRANSLATION_PREFIX}.${category}.${value}`;
};

export const TranslatedReferenceData = ({ category, value, fallback, placeholder }) => {
  return value ? (
    <TranslatedText
      stringId={getReferenceDataStringId(value, category)}
      fallback={`${fallback}`}
      data-testid="translatedtext-w3hp"
    />
  ) : (
    placeholder
  );
};

TranslatedReferenceData.propTypes = {
  category: PropTypes.string.isRequired,
  value: PropTypes.string,
  fallback: PropTypes.string.isRequired,
  placeholder: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
};
