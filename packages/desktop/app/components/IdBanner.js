import React from 'react';
import styled from 'styled-components';
import { PersonAdd } from '@material-ui/icons';

import { LocalisedText } from './LocalisedText';
import { Colors } from '../constants';

const IdFieldContainer = styled.div`
  background: ${Colors.primary};
  padding: 33px;
  display: grid;
  grid-template-columns: 1fr 150px;
  grid-template-rows: 1fr 1fr;

  svg,
  p {
    color: ${Colors.white};
  }
`;

const IdFieldTitle = styled.div`
  color: ${Colors.secondary};
  font-weight: 500;
  font-size: 18px;
`;

const AddUserIcon = styled.div`
  grid-column: 2 / 3;
  grid-row: 1 / 3;

  svg {
    color: ${Colors.primaryDark};
    height: 80px;
    width: 100px;
    float: right;
  }
`;

export const IdBanner = ({ children }) => (
  <IdFieldContainer>
    <IdFieldTitle>
      <LocalisedText path="fields.displayId.longLabel" />
    </IdFieldTitle>

    {children}

    <AddUserIcon>
      <PersonAdd />
    </AddUserIcon>
  </IdFieldContainer>
);
