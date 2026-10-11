import React from 'react';
import styled from 'styled-components';

import { CheckCircleIcon } from '../assets/icons/CheckCircleIcon';
import { Colors } from '../constants/styles';
import { TranslatedText } from './Translation/TranslatedText';

const CompleteText = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
`;

// spec: SYND#diagnosis-pane
export const SyndromicSurveillanceComplete = ({ 'data-testid': dataTestId }) => (
  <CompleteText data-testid={dataTestId}>
    <CheckCircleIcon fill={Colors.safe} aria-hidden data-testid="checkcircleicon-complete" />
    <TranslatedText
      stringId="encounter.syndromicSurveillance.complete"
      fallback="Complete"
      data-testid="translatedtext-syndromic-surveillance-complete"
    />
  </CompleteText>
);
