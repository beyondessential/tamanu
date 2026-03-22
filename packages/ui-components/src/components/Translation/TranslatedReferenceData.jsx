import React from 'react';
import PropTypes from 'prop-types';
import { getReferenceDataStringId } from '@tamanu/shared/utils/translation';
import { TranslatedText } from './TranslatedText';

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
