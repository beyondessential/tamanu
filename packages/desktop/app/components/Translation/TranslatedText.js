import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';

const DebugHighlighed = styled.span`
  background-color: red;
  color: white;
`;

// "stringId" is used in future functionality
// eslint-disable-next-line no-unused-vars
export const TranslatedText = ({ stringId, fallback }) => {
  const [isDebugMode, setIsDebugMode] = useState(false);
  const translation = null; // Placeholder for checking db for translation

  useEffect(() => {
    const getDebugMode = async () => {
      const debugMode = await JSON.parse(localStorage.getItem('debugTranslation'));
      setIsDebugMode(debugMode);
    };
    getDebugMode();

    window.addEventListener('debugTranslation', getDebugMode);
    return () => {
      window.removeEventListener('debugTranslation', getDebugMode);
    };
  }, []);

  const TextWrapper = isDebugMode ? DebugHighlighed : React.Fragment;

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
