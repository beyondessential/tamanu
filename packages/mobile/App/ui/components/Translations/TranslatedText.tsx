import React, { ReactElement, ReactNode, useMemo } from 'react';
import styled from 'styled-components';
import { StyledText } from '~/ui/styled/common';
import { useTranslation } from '~/ui/contexts/TranslationContext';

type Replacements = { [key: string]: ReactNode };
interface TranslatedTextProps {
  stringId: string;
  fallback: string;
  replacements?: Replacements;
  uppercase?: boolean;
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
const replaceStringVariables = (
  templateString: string,
  replacements: Replacements,
  uppercase: boolean,
) => {
  const jsxElements = templateString.split(/(:[a-zA-Z]+)/g).map((part, index) => {
    // Even indexes are the unchanged parts of the string
    if (index % 2 === 0) return part;

    return replacements[part.slice(1)] || part;
  });

  return uppercase
    ? jsxElements.map(element => (typeof element === 'string' ? element.toUpperCase() : element))
    : jsxElements;
};

export const TranslatedText = ({
  stringId,
  fallback,
  replacements,
  uppercase = false,
}: TranslatedTextProps): ReactElement => {
  const { debugMode, getTranslation } = useTranslation();
  const translation = getTranslation(stringId) || fallback;

  const displayElements = useMemo(() => {
    return replaceStringVariables(translation, replacements, uppercase);
  }, [translation, replacements]);

  const isDebugMode = __DEV__ && debugMode;

  return <TextWrapper $isDebugMode={true}>{displayElements}</TextWrapper>;
};
