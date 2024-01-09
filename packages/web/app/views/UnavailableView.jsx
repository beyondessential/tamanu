import React from 'react';
import { Typography } from '@material-ui/core';
import styled from 'styled-components';
import { Colors } from '../constants/index.js';

const UnavailableHeading = styled(Typography)`
  color: ${Colors.darkestText};
  font-weight: 500;
  font-size: 38px;
  margin-top: 100px;
`;

const UnavailableBodyText = styled(Typography)`
  color: ${Colors.midText};
  font-weight: 400;
  font-size: 16px;
  line-height: 21px;
  max-width: 450px;
`;

const ScreenContainer = styled.div`
  min-height: 100vh;
  width: 100%;
  margin: 0;
  background-color: white;
  display: flex;
  align-items: center;
  flex-direction: column;
`;

export const UnavailableView = () => {
  return (
    <ScreenContainer>
      <UnavailableHeading>Tamanu is currently unavailable</UnavailableHeading>
      <UnavailableBodyText>
        Tamanu is currently unavailable. Please try again later or contact your system administrator
        for further information.
      </UnavailableBodyText>
    </ScreenContainer>
  );
};
