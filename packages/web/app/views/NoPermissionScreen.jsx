import React from 'react';
import styled from 'styled-components';

import backgroundImage from '../assets/images/hospital_illustration_background.svg';
import { Colors } from '../constants';
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
  background-color: ${Colors.white};
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
  color: ${Colors.darkText};
`;

// To be rendered in place of content when user has no permission for an entire view
export const NoPermissionScreen = () => {
  return (
    <Container>
      <Message>
        <Heading>
          <TranslatedText
            stringId="general.permission.permissionRequired.title"
            fallback="Permission required"
          />
        </Heading>
        <Description>
          <TranslatedText
            stringId="general.permission.permissionRequiredMessage"
            fallback="You do not have permission to use this feature\nPlease speak to your System Administrator if you think this is incorrect."
          />
        </Description>
      </Message>
    </Container>
  );
};
