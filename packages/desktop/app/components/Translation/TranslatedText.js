import React, { useEffect, useState, useMemo } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { ipcRenderer } from 'electron';
import { useTranslation } from '../../contexts/Translation';

const DEBUG_TRANSLATION_STORAGE_KEY = 'debugTranslation';

const DebugHighlighed = styled.span`
  background-color: red;
  color: white;
`;

const safeGetIsDebugMode = () => {
  try {
    return JSON.parse(localStorage.getItem(DEBUG_TRANSLATION_STORAGE_KEY));
  } catch (e) {
    return false;
  }
};

ipcRenderer.on('toggleTranslationDebug', () => {
  localStorage.setItem(DEBUG_TRANSLATION_STORAGE_KEY, !safeGetIsDebugMode());
  window.dispatchEvent(new Event(DEBUG_TRANSLATION_STORAGE_KEY));
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
  const { getTranslation } = useTranslation();
  const [isDebugMode, setIsDebugMode] = useState(false);

  const translation = getTranslation(stringId, fallback);

  useEffect(() => {
    const getDebugMode = async () => setIsDebugMode(safeGetIsDebugMode());
    getDebugMode();
    window.addEventListener(DEBUG_TRANSLATION_STORAGE_KEY, getDebugMode);
    return () => window.removeEventListener(DEBUG_TRANSLATION_STORAGE_KEY, getDebugMode);
  }, []);

  const displayElements = useMemo(() => {
    if (!replacements) return translation;
    return replaceStringVariables(translation, replacements);
  }, [translation, replacements]);

  const TextWrapper = isDebugMode ? DebugHighlighed : React.Fragment;

  return <TextWrapper>{displayElements}</TextWrapper>;
};

TranslatedText.propTypes = {
  stringId: PropTypes.string.isRequired,
  fallback: PropTypes.string.isRequired,
};
