import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';

const DebugHighlighed = styled.span`
  background-color: red;
  color: white;
`;

export const TranslatedText = ({ stringId, fallback }) => {
  const translation = null; // Placeholder for checking db for translation
  const debugMode = JSON.parse(localStorage.getItem('debugTranslation'));

  const TextWrapper = debugMode ? DebugHighlighed : React.Fragment;

  if (!translation) {
    // Register as untranslated in DB
    return <TextWrapper>{fallback}</TextWrapper>;
  }

  return <TextWrapper>{translation}</TextWrapper>;
};

TranslatedText.propTypes = {
  stringId: PropTypes.string.isRequired,
  fallback: PropTypes.string.isRequired,
};
