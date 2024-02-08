import React from 'react';
import PropTypes from 'prop-types';
import { TranslatedText } from './TranslatedText';

export const TranslatedReferenceData = ({ category, value, fallback }) => {
  return (
    <TranslatedText
      stringId={`referenceData.${category}.${value}`}
      fallback={`${fallback }`}
    />
  );
};

TranslatedReferenceData.propTypes = {
  category: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  fallback: PropTypes.string.isRequired,
};
