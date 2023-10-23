import React, { ReactElement, ReactNode, useEffect, useState } from 'react';
import styled from 'styled-components';
import { StyledText } from '~/ui/styled/common';
import { useTranslation } from '~/ui/contexts/TranslationContext';

type TranslatedTextProps = {
  stringId: string;
  fallback: string;
  replacements?: object;
};

const DebugHighlighted = styled(StyledText)`
  background-color: red;
  color: white;
`;

// Duplicated from TranslatedText.js on desktop
const replaceStringVariables = (templateString: string, replacements: object) => {
  const jsxElements = templateString.split(/(:[a-zA-Z]+)/g).map((part, index) => {
    // Even indexes are the unchanged parts of the string
    if (index % 2 === 0) return part;
    return replacements[part.slice(1)] || part;
  });

  return jsxElements;
};

export const TranslatedText = ({
  stringId,
  fallback,
  replacements,
}: TranslatedTextProps): ReactElement => {
  const { getDebugMode } = useTranslation();
  const [displayElements, setDisplayElements] = useState<ReactNode>(fallback);
  // Placeholder for fetching translation from context
  const translation = null;

  const stringToDisplay = translation || fallback;

  useEffect(() => {
    if (!replacements) {
      setDisplayElements(stringToDisplay);
      return;
    }
    setDisplayElements(replaceStringVariables(stringToDisplay, replacements));
  }, [translation]);

  const isDebugMode = __DEV__ && getDebugMode();
  const TextWrapper = isDebugMode ? DebugHighlighted : React.Fragment;

  return <TextWrapper>{displayElements}</TextWrapper>;
};
