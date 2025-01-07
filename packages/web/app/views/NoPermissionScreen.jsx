import React from 'react';
import styled from 'styled-components';

import backgroundImage from '../assets/images/hospital_illustration_background.svg';
import { Colors } from '../constants';

const Container = styled.div`
  border: 1px #dedede solid;
  border-radius: 3px;
  width: 100%;
  height: 100%;
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
  position: absolute;
  top: 254px;
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

export const NoPermissionScreen = () => {
  return (
    <Container>
      <Message>
        <Heading>Permission required</Heading>
        <Description>
          You do not have permission to use this feature <br />
          Please speak to your System Administrator if you think this is incorrect.
        </Description>
      </Message>
    </Container>
  );
};
