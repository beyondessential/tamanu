import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { ipcRenderer } from 'electron';
import { useTranslation } from '../../contexts/Translation';

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
  const jsxElements = templateString.split(/(:[a-zA-Z]+)/g).map((part, index) => {
    // Even indexes are the unchanged parts of the string
    if (index % 2 === 0) return part;
    // Return the replacement if exists
    return replacements[part.slice(1)] || part;
  });

  return jsxElements;
};

export const TranslatedText = ({ stringId, fallback, replacements }) => {
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [displayElements, setDisplayElements] = useState(null);

  const { getTranslation } = useTranslation();
  const translation = getTranslation(stringId) || fallback;

  useEffect(() => {
    const getDebugMode = async () => setIsDebugMode(safeGetIsDebugMode());
    getDebugMode();

    window.addEventListener('debugTranslation', getDebugMode);
    return () => window.removeEventListener('debugTranslation', getDebugMode);
  }, []);

  useEffect(() => {
    if (!replacements) {
      setDisplayElements(translation);
      return;
    }
    setDisplayElements(replaceStringVariables(translation, replacements));
  }, [translation, replacements]);

  const TextWrapper = isDebugMode ? DebugHighlighed : React.Fragment;

  return <TextWrapper>{displayElements}</TextWrapper>;
};

TranslatedText.propTypes = {
  stringId: PropTypes.string.isRequired,
  fallback: PropTypes.string.isRequired,
};
