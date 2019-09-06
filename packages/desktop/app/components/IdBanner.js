import React from 'react';
import styled from 'styled-components';
import { PersonAdd } from '@material-ui/icons';

const IdFieldContainer = styled.div`
  background: #326699;
  padding: 33px;
  display: grid;
  grid-template-columns: 1fr 150px;
  grid-template-rows: 1fr 1fr;

  svg,
  p {
    color: #fff;
  }
`;

const IdFieldTitle = styled.div`
  color: #ffcc24;
  font-weight: 500;
  font-size: 18px;
`;

const AddUserIcon = styled.div`
  grid-column: 2 / 3;
  grid-row: 1 / 3;

  svg {
    color: #2f4358;
    height: 80px;
    width: 100px;
    float: right;
  }
`;

export const IdBanner = props => {
  return (
    <IdFieldContainer>
      <IdFieldTitle>Health Identification Number</IdFieldTitle>

      {props.children}

      <AddUserIcon>
        <PersonAdd />
      </AddUserIcon>
    </IdFieldContainer>
  );
};
