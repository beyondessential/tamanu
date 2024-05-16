import React, { ReactElement } from 'react';
import styled from 'styled-components';
import { StyledText } from '~/ui/styled/common';
import { TranslatedTextProps, useTranslation } from '~/ui/contexts/TranslationContext';

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

export type TranslatedTextElement = ReactElement<TranslatedTextProps> | string;

export const TranslatedText = ({
  stringId,
  fallback,
  replacements,
  uppercase = false,
}: TranslatedTextProps): ReactElement => {
  const { debugMode, getTranslation } = useTranslation();
  const translation = getTranslation(stringId, fallback, replacements);

  const isDebugMode = __DEV__ && debugMode;

  return <TextWrapper $isDebugMode={isDebugMode}>{uppercase ? translation.toUpperCase() : translation}</TextWrapper>;
};
