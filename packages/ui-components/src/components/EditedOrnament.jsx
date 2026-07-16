import React from 'react';
import styled from 'styled-components';
import { VisuallyHidden } from './VisuallyHidden';
import { TranslatedText } from './Translation';

export const EditedOrnament = styled.span.attrs({
  children: (
    <VisuallyHidden>
      <TranslatedText stringId="general.label.edited" fallback="Edited" />
    </VisuallyHidden>
  ),
})`
  &::before {
    content: '*';
  }
`;
