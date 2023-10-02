import React from 'react';
import styled from 'styled-components';

const DebugHighlighed = styled.span`
  background-color: red;
  color: white;
`;

export const TranslatedText = ({ stringId, fallback }) => {
  const translation = null; // Placeholder for checking db for translation
  const debugMode = JSON.parse(localStorage.getItem('debugTranslation'));

  const TextWrapper = debugMode ? DebugHighlighed : React.Fragment;

  if (!translation && !fallback) {
    return <TextWrapper>Unhandled translation for {stringId}</TextWrapper>;
  }

  if (!translation) {
    // Register as untranslated in DB
    return <TextWrapper>{fallback}</TextWrapper>;
  }

  return <TextWrapper>{translation}</TextWrapper>;
};
