import React from 'react';
import PropTypes from 'prop-types';

export const TranslatedReferenceData = ({ category, value, fallback }) => {
  return (
    <TranslatedText
      stringId={`referenceData.${category}.${value}`}
      fallback={`${fallback || value}`}
    />
  );
};

TranslatedText.propTypes = {
  category: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  fallback: PropTypes.string,
};
