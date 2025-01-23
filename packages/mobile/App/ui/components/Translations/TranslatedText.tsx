import React, { ReactElement, useMemo } from 'react';
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
  casing,
}: TranslatedTextProps): ReactElement => {
  const { debugMode, getTranslation } = useTranslation();
  const translation = useMemo(
    () => getTranslation(stringId, fallback?.split('\\n').join('\n'), { replacements, casing }),
    [getTranslation, stringId, fallback, replacements, casing],
  );

  const isDebugMode = __DEV__ && debugMode;

  return <TextWrapper $isDebugMode={isDebugMode}>{translation}</TextWrapper>;
};
