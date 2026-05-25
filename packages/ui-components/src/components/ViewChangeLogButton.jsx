import React from 'react';
import styled from 'styled-components';

import { UnstyledHtmlButton } from './Button';
import { TranslatedText } from './Translation';

export const ViewChangeLogButton = styled(UnstyledHtmlButton).attrs({
  children: (
    <TranslatedText
      stringId="general.action.viewChangeLog"
      fallback="View change log"
      casing="lower"
    />
  ),
  type: 'button',
})`
  cursor: pointer;
  display: inline;
  text-decoration-line: underline;
  &:focus-visible,
  &:hover {
    color: ${p => p.theme.palette.primary.main};
  }
`;
