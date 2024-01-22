import React from 'react';
import { LargeBodyText } from './Typography';
import styled, { keyframes } from 'styled-components';
import { Colors } from '../constants';
import { TamanuLogoLeftIconBlue } from './TamanuLogo';
import { Typography } from '@material-ui/core';

import screen_4 from '../assets/images/splashscreens/screen_4.png';

const FlexContainer = styled.div`
  display: flex;
`;

const Container = styled.div`
  padding: 25px 35px;
  height: 100vh;
  background: ${Colors.white};
  flex: 1;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  align-items: ${props => (props.$heroImage ? 'flex-start' : 'center')};
  margin: ${props => (props.$heroImage ? '200px' : '50px')} auto;
  ${props => props.$heroImage && 'max-width: 467px;'}
`;

const ErrorMessage = styled(Typography).attrs({
  variant: 'h1',
})`
  font-weight: 500;
  font-size: 38px;
  line-height: 32px;
`;

const ErrorDescription = styled(LargeBodyText)`
  margin-top: 20px;
  max-width: 450px;
  text-align: ${props => (props.$heroImage ? 'left' : 'center')};
`;

const Logo = styled(TamanuLogoLeftIconBlue)`
  cursor: pointer;
`;

const ellipsis = keyframes`
  from {
    width: 0;
  }
  to {
    width: 1.22em;
  }
  `;

const AnimateEllipsis = styled.span`
  width: 352px;
  display: block;
  &:after {
    overflow: hidden;
    display: inline-block;
    vertical-align: bottom;
    animation: ${ellipsis} steps(4, end) 900ms infinite;
    content: '...'; /* ascii code for the ellipsis character */
  }
`;

const HeroImage = styled.div`
  background-image: url(${screen_4});
  background-size: cover;
  height: 100vh;
  width: 50vw;
`;

export const StatusPage = ({ message, description, heroImage }) => {
  const handleRefreshPage = () => {
    window.location.reload();
  };
  return (
    <FlexContainer>
      <Container>
        <Logo onClick={handleRefreshPage} />
        <Content $heroImage={heroImage}>
          <ErrorMessage>{message}</ErrorMessage>
          <ErrorDescription $heroImage={heroImage} color="textTertiary">
            {description}
          </ErrorDescription>
        </Content>
      </Container>
      {heroImage && <HeroImage />}
    </FlexContainer>
  );
};

export const LoadingStatusPage = () => (
  <StatusPage
    message={<AnimateEllipsis>Tamanu is loading</AnimateEllipsis>}
    description="Tamanu is currently loading. Please do not navigate away from this page."
  />
);

export const UnavailableStatusPage = () => (
  <StatusPage
    message="Tamanu is currently unavailable"
    description="Tamanu is currently unavailable. Please try again later or contact your system administrator for further information."
  />
);

export const UnsupportedBrowserStatusPage = () => (
  <StatusPage
    message="Tamanu is only available on Chrome"
    description="Please contact your system administrator for further information on how to access Tamanu using a Chrome browser."
    heroImage={screen_4}
  />
);
