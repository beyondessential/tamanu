import { TAMANU_COLORS } from '@tamanu/ui-components';
import React from 'react';
import styled from 'styled-components';

import backgroundImage from '../assets/images/hospital_illustration_background.svg';

import { TranslatedText } from '../components';

const Container = styled.div`
  border: 1px #dedede solid;
  border-radius: 3px;
  width: calc(100% - 40px);
  height: calc(100% - 40px);
  margin: 20px;
  display: flex;
  justify-content: center;
  position: relative;
  background-color: ${TAMANU_COLORS.white};
  background-image: url(${backgroundImage});
  background-repeat: no-repeat;
  background-position: center bottom 23px;
`;

const Message = styled.div`
  width: 50%;
  text-align: center;
  margin-top: 33vh;
`;

const Heading = styled.h1`
  margin: 4px;
  font-size: 24px;
  font-weight: 500;
`;

const Description = styled.h4`
  font-size: 16px;
  font-weight: 400;
  color: ${TAMANU_COLORS.darkText};
`;

export const NoPermissionScreen = () => {
  return (
    <Container data-testid="container-d7rd">
      <Message data-testid="message-mq8u">
        <Heading data-testid="heading-oz8d">
          <TranslatedText
            stringId="general.permission.permissionRequired.title"
            fallback="Permission required"
            data-testid="translatedtext-u7h7"
          />
        </Heading>
        <Description data-testid="description-u3h1">
          <TranslatedText
            stringId="general.permission.permissionRequired.message"
            fallback="You do not have permission to use this feature\nPlease speak to your System Administrator if you think this is incorrect."
            data-testid="translatedtext-oafm"
          />
        </Description>
      </Message>
    </Container>
  );
};
