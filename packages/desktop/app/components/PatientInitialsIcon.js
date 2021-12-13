import React, { memo } from 'react';
import styled from 'styled-components';
import { Colors } from '../constants';

const Container = styled.div`
  padding: 7px;
  border-radius: 200px;
  background: ${Colors.primary};
  color: ${Colors.white};
  font-size: 16px;
  width: 40px;
  height: 40px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const PatientInitialsIcon = memo(({ patient }) => {
  const first = patient.firstName ? patient.firstName.substring(0, 1) : '';
  const last = patient.lastName ? patient.lastName.substring(0, 1) : '';
  return <Container>{`${first}${last}`}</Container>;
}); // TODO add sync status symbol
