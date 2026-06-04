import React from 'react';
import styled from 'styled-components';
import { TranslatedText } from './Translation';
import { VisuallyHidden } from './VisuallyHidden';

export const RequiredOrnament = styled.span.attrs({
  children: (
    <VisuallyHidden>
      <TranslatedText stringId="general.label.required" fallback="Required" />
    </VisuallyHidden>
  ),
})`
  color: ${p => p.theme.palette.error.main};
  &::before {
    content: '*';
    margin-inline-start: 3px;
  }
`;
