import React from 'react';
import styled from 'styled-components';
import { TamanuLogoHorizontal } from '../components';

const Body = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  align-items: center;
`;

const LogoContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  padding: 1.38rem;
`;

const TextContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-top: 6.06rem;
  max-width: 40rem;
  text-align: center;
`;

export const MultiTabView = () => {
  return (
    <>
      <Body>
        <LogoContainer>
          <TamanuLogoHorizontal size="8.75rem" />
        </LogoContainer>
        <TextContainer>
          <h1>Tamanu can not be opened across multiple tabs.</h1>
          <p>Please continue working in the existing tab.</p>
        </TextContainer>
      </Body>
    </>
  );
};
