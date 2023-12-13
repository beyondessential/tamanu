import React from 'react';
import styled from 'styled-components';

import { Colors } from '../constants';
import { LocalisedText } from './LocalisedText';

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
  <IdFieldContainer>
    <IdFieldTitle>
      <LocalisedText path="fields.displayId.longLabel" />
    </IdFieldTitle>

    {children}
  </IdFieldContainer>
);
