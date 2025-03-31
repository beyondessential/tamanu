import React from 'react';
import { LargeBodyText } from './Typography';
import styled, { keyframes } from 'styled-components';
import { Colors } from '../constants';
import { LogoDark } from './Logo';
import { Typography } from '@material-ui/core';
import HeroImg from '../assets/images/splashscreens/screen_4.png';
import { getBrandName } from '../utils';
import { TranslatedText } from '../components/Translation/TranslatedText';

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
  align-items: center;
  margin: 50px auto;
`;

const ErrorMessage = styled(Typography).attrs({
  variant: 'h1',
})`
  font-weight: 500;
  font-size: 38px;
`;

const ErrorDescription = styled(LargeBodyText)`
  margin-top: 20px;
  max-width: 450px;
  text-align: ${props => (props.$heroImage ? 'left' : 'center')};
`;

const Logo = styled(LogoDark)`
  cursor: pointer;
`;

const handleRefreshPage = () => {
  window.location.reload();
};

export const StatusPage = ({ message, description }) => {
  return (
    <Container>
      <Logo onClick={handleRefreshPage} size="140px" />
      <Content>
        <ErrorMessage>{message}</ErrorMessage>
        <ErrorDescription color="textTertiary">{description}</ErrorDescription>
      </Content>
    </Container>
  );
};

export const UnavailableStatusPage = () => {
  const brandName = getBrandName();
  return (
    <StatusPage
      message={
        <TranslatedText
          stringId="splash.unavailable.message"
          fallback=":brandName is currently unavailable"
          replacements={{ brandName }}
          data-testid='translatedtext-c4em' />
      }
      description={
        <TranslatedText
          stringId="splash.unavailable.description"
          fallback=":brandName is currently unavailable. Please try again later or contact your system administrator for further information."
          replacements={{ brandName }}
          data-testid='translatedtext-26m1' />
      }
    />
  );
};

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

export const LoadingStatusPage = () => {
  const brandName = getBrandName();
  return (
    <StatusPage
      message={
        <AnimateEllipsis>
          <TranslatedText
            stringId="splash.loading.message"
            fallback=":brandName is loading"
            replacements={{ brandName }}
            data-testid='translatedtext-gr83' />
        </AnimateEllipsis>
      }
      description={
        <TranslatedText
          stringId="splash.loading.description"
          fallback=":brandName is currently loading. Please do not navigate away from this page."
          replacements={{ brandName }}
          data-testid='translatedtext-zieu' />
      }
    />
  );
};

const HeroImage = styled.div`
  background-image: url(${HeroImg});
  background-size: cover;
  height: 100vh;
  width: 50vw;
`;

const HeroContent = styled(Content)`
  align-items: flex-start;
  margin: 200px auto;
  max-width: 467px;
`;

const HeroErrorDescription = styled(ErrorDescription)`
  text-align: left;
`;

export const StatusPageWithHeroImage = ({ message, description }) => {
  return (
    <FlexContainer>
      <Container>
        <Logo onClick={handleRefreshPage} size="140px" />
        <HeroContent>
          <ErrorMessage>{message}</ErrorMessage>
          <HeroErrorDescription color="textTertiary">{description}</HeroErrorDescription>
        </HeroContent>
      </Container>
      <HeroImage />
    </FlexContainer>
  );
};

export const UnsupportedBrowserStatusPage = () => {
  const brandName = getBrandName();
  return (
    <StatusPageWithHeroImage
      message={
        <TranslatedText
          stringId="splash.browser.message"
          fallback=":brandName is not available on your browser"
          replacements={{ brandName }}
          data-testid='translatedtext-9a8u' />
      }
      description={
        <TranslatedText
          stringId="splash.browser.description"
          fallback="Please contact your system administrator for further information on how to access :brandName using a Chrome or Edge browser."
          replacements={{ brandName }}
          data-testid='translatedtext-x5wp' />
      }
    />
  );
};

const MobileContainer = styled(Container)`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  img {
    display: block;
    margin: 0 auto;
    width: ${props => (props.$platformType === 'tablet' ? '371px' : '194px')}};
  }
  div {
    font-size: ${props => (props.$platformType === 'tablet' ? '18px' : '14px')}};
  }
`;

export const MobileStatusPage = ({ platformType }) => {
  const brandName = getBrandName();
  return (
    <MobileContainer $platformType={platformType}>
      <Logo onClick={handleRefreshPage} size="140px" />
      <ErrorDescription color="textTertiary">
        <TranslatedText
          stringId="splash.mobile.description"
          fallback=":brandName is not currently supported by mobile or tablet devices. Please access via a desktop computer or laptop."
          replacements={{ brandName }}
          data-testid='translatedtext-e1mm' />
      </ErrorDescription>
    </MobileContainer>
  );
};

const SingleTabErrorMessage = styled(ErrorMessage)`
  text-align: center;
`;

export const SingleTabStatusPage = () => {
  const brandName = getBrandName();
  return (
    <StatusPage
      message={
        <SingleTabErrorMessage>
          <TranslatedText
            stringId="splash.singleTab.message"
            fallback=":brandName can not be opened across multiple tabs."
            replacements={{ brandName }}
            data-testid='translatedtext-8hnj' />
        </SingleTabErrorMessage>
      }
      description={
        <TranslatedText
          stringId="splash.singleTab.description"
          fallback="Please continue working in the existing tab."
          replacements={{ brandName }}
          data-testid='translatedtext-tcgd' />
      }
    />
  );
};
