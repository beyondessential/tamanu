import React from 'react';
import styled from 'styled-components';

import { Colors } from '../constants';
import { TranslatedText } from './Translation/TranslatedText';

const IdFieldContainer = styled.div`
  background: ${Colors.primary};
  padding: 33px;

  svg,
  p {
    color: ${Colors.white};
  }
`;

const IdFieldTitle = styled.div`
  color: ${Colors.white};
  font-weight: 500;
  font-size: 18px;
  margin-bottom: 20px;
`;

export const IdBanner = ({ children }) => (
  <IdFieldContainer data-testid="idfieldcontainer-fd2l">
    <IdFieldTitle data-testid="idfieldtitle-pcqe">
      <TranslatedText
        stringId="general.localisedField.displayId.label"
        fallback="National Health Number"
        data-testid="translatedtext-c57l"
      />
      :
    </IdFieldTitle>

    {children}
  </IdFieldContainer>
);
