import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';

const DebugHighlighed = styled.span`
  background-color: red;
  color: white;
`;

const replaceStringVariables = (templateString, replacements) => {
  const colonReplacementRegex = /:([a-zA-Z]+)/g;
  const stringParts = templateString.split(colonReplacementRegex)
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
  const translation = null; // Placeholder for checking db for translation
  const debugMode = JSON.parse(localStorage.getItem('debugTranslation'));

  const TextWrapper = debugMode ? DebugHighlighed : React.Fragment;

  if (!translation) {
    // Register as untranslated in DB
    return (
      <TextWrapper>
        {replacements ? replaceStringVariables(fallback, replacements) : fallback}
      </TextWrapper>
    );
  }

  return <TextWrapper>{replaceStringVariables(translation, replacements)}</TextWrapper>;
};

TranslatedText.propTypes = {
  stringId: PropTypes.string.isRequired,
  fallback: PropTypes.string.isRequired,
};
