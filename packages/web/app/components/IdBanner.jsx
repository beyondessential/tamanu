import React from 'react';
import styled from 'styled-components';

import { TAMANU_COLORS } from '@tamanu/ui-components';
import { TranslatedText } from './Translation/TranslatedText';

const IdFieldContainer = styled.div`
  background: ${TAMANU_COLORS.primary};
  padding: 33px;

  svg,
  p {
    color: ${TAMANU_COLORS.white};
  }
`;

const IdFieldTitle = styled.div`
  color: ${TAMANU_COLORS.white};
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
