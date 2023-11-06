import React, { ReactElement, ReactNode, useMemo } from 'react';
import styled from 'styled-components';
import { StyledText } from '~/ui/styled/common';
import { useTranslation } from '~/ui/contexts/TranslationContext';

type Replacements = { [key: string]: ReactNode };
interface TranslatedTextProps {
  stringId: string;
  fallback: string;
  replacements?: Replacements;
}

const TextWrapper = styled(StyledText)<{
  $isDebugMode: boolean;
}>`
  ${props =>
    props.$isDebugMode &&
    `
    background-color: red;
    color: white;
  `};
`;

// Duplicated from TranslatedText.js on desktop
const replaceStringVariables = (templateString: string, replacements: Replacements) => {
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
  const { debugMode, getTranslation } = useTranslation();
  const translation = getTranslation(stringId) || fallback;

  const displayElements = useMemo(() => {
    if (!replacements) {
      return translation;
    }
    return replaceStringVariables(translation, replacements);
  }, [translation, replacements]);

  const isDebugMode = __DEV__ && debugMode;

  return <TextWrapper $isDebugMode={isDebugMode}>{displayElements}</TextWrapper>;
};
