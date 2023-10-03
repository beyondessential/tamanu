import React from 'react';
import styled from 'styled-components';

const DebugHighlighed = styled.span`
  background-color: red;
  color: white;
`;

const replaceStringVariables = (templateString, replacements) => {
  return templateString.replace(/:([a-zA-Z]+)/g, (match, variableName) => {
    if (replacements.hasOwnProperty(variableName)) {
      return replacements[variableName];
    }
    return match;
  });
}

export const TranslatedText = ({ stringId, fallback, replacements }) => {
  const translation = null; // Placeholder for checking db for translation

  const debugMode = JSON.parse(localStorage.getItem('debugTranslation'));
  const TextWrapper = debugMode ? DebugHighlighed : React.Fragment;

  if (!translation) {
    // Register as untranslated in DB
    return <TextWrapper>{replaceStringVariables(fallback, replacements)}</TextWrapper>;
  }

  return <TextWrapper>{replaceStringVariables(translation, replacements)}</TextWrapper>;
};
