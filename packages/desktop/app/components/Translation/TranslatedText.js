import React from 'react';
import PropTypes from 'prop-types';

// "stringId" is used in future functionality
// eslint-disable-next-line no-unused-vars
export const TranslatedText = ({ stringId, fallback }) => {
  const translation = null; // Placeholder for checking db for translation

  if (!translation) {
    // Register as untranslated in DB
    return <>{fallback}</>;
  }

  return <>{translation}</>;
};

TranslatedText.propTypes = {
  stringId: PropTypes.string.isRequired,
  fallback: PropTypes.string.isRequired,
};
