import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { ipcRenderer } from 'electron';

const DebugHighlighed = styled.span`
  background-color: red;
  color: white;
`;

const safeGetIsDebugMode = () => {
  try {
    return JSON.parse(localStorage.getItem('debugTranslation'));
  } catch (e) {
    return false;
  }
};

ipcRenderer.on('toggleTranslationDebug', () => {
  localStorage.setItem('debugTranslation', !safeGetIsDebugMode());
  window.dispatchEvent(new Event('debugTranslation'));
});

const replaceStringVariables = (templateString, replacements) => {
  if (!replacements) return templateString
  const colonReplacementRegex = /:([a-zA-Z]+)/g;
  const stringParts = templateString.split(colonReplacementRegex);
  const jsxElements = stringParts.map((part, index) => {
    // Even indexes are the unchanged parts of the string
    if (index % 2 === 0) {
      return part;
    }
    // Return the replacement if exists
    return replacements[part] || `:${part}`;
  });
  return jsxElements;
};

// "stringId" is used in future functionality
// eslint-disable-next-line no-unused-vars
export const TranslatedText = ({ stringId, fallback, replacements }) => {
  const [isDebugMode, setIsDebugMode] = useState(false);
  const translation = null; // Placeholder for checking db for translation

  useEffect(() => {
    const getDebugMode = async () => {
      setIsDebugMode(safeGetIsDebugMode());
    };
    getDebugMode();

    window.addEventListener('debugTranslation', getDebugMode);
    return () => {
      window.removeEventListener('debugTranslation', getDebugMode);
    };
  }, []);

  if (!translation) {
    // Register as untranslated in DB
  }

  const stringToReplace = translation || fallback;
  const stringWithReplacements = replaceStringVariables(stringToReplace, replacements);

  const TextWrapper = isDebugMode ? DebugHighlighed : React.Fragment;

  return <TextWrapper>{stringWithReplacements}</TextWrapper>;
};

TranslatedText.propTypes = {
  stringId: PropTypes.string.isRequired,
  fallback: PropTypes.string.isRequired,
};
