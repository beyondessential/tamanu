import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { ipcRenderer } from 'electron';
import { DebugTooltip } from './DebugTooltip';

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

// "stringId" is used in future functionality
// eslint-disable-next-line no-unused-vars
export const TranslatedText = ({ stringId, fallback, replacements }) => {
  const [isDebugMode, setIsDebugMode] = useState(false);
  // "setTranslation" is used in future functionality
  // eslint-disable-next-line no-unused-vars
  const [translation, setTranslation] = useState(fallback);
  const [displayElements, setDisplayElements] = useState(fallback);

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

  useEffect(() => {
    if (!replacements) setDisplayElements(translation);
    setDisplayElements(replaceStringVariables(translation, replacements));
  }, [translation, replacements]);

  if (isDebugMode)
    return (
      <DebugTooltip stringId={stringId} replacements={replacements} fallback={fallback}>
        {displayElements}
      </DebugTooltip>
    );
  return displayElements;
};

TranslatedText.propTypes = {
  stringId: PropTypes.string.isRequired,
  fallback: PropTypes.string.isRequired,
};
