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
  text-align: ${(props) => (props.$heroImage ? 'left' : 'center')};
`;

const Logo = styled(LogoDark)`
  cursor: pointer;
`;

const handleRefreshPage = () => {
  window.location.reload();
};

export const StatusPage = ({ message, description }) => {
  return (
    <Container data-testid="container-1hqo">
      <Logo onClick={handleRefreshPage} size="140px" data-testid="logo-4eba" />
      <Content data-testid="content-l8t6">
        <ErrorMessage data-testid="errormessage-1cka">{message}</ErrorMessage>
        <ErrorDescription color="textTertiary" data-testid="errordescription-6s2k">
          {description}
        </ErrorDescription>
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
          data-testid="translatedtext-v4w9"
        />
      }
      description={
        <TranslatedText
          stringId="splash.unavailable.description"
          fallback=":brandName is currently unavailable. Please try again later or contact your system administrator for further information."
          replacements={{ brandName }}
          data-testid="translatedtext-hapm"
        />
      }
      data-testid="statuspage-dmk1"
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
        <AnimateEllipsis data-testid="animateellipsis-271r">
          <TranslatedText
            stringId="splash.loading.message"
            fallback=":brandName is loading"
            replacements={{ brandName }}
            data-testid="translatedtext-e9xh"
          />
        </AnimateEllipsis>
      }
      description={
        <TranslatedText
          stringId="splash.loading.description"
          fallback=":brandName is currently loading. Please do not navigate away from this page."
          replacements={{ brandName }}
          data-testid="translatedtext-80y2"
        />
      }
      data-testid="statuspage-d6p8"
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
    <FlexContainer data-testid="flexcontainer-jfut">
      <Container data-testid="container-j6sh">
        <Logo onClick={handleRefreshPage} size="140px" data-testid="logo-vbvf" />
        <HeroContent data-testid="herocontent-7koj">
          <ErrorMessage data-testid="errormessage-rkiw">{message}</ErrorMessage>
          <HeroErrorDescription color="textTertiary" data-testid="heroerrordescription-zt18">
            {description}
          </HeroErrorDescription>
        </HeroContent>
      </Container>
      <HeroImage data-testid="heroimage-z3v9" />
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
          data-testid="translatedtext-rlzy"
        />
      }
      description={
        <TranslatedText
          stringId="splash.browser.description"
          fallback="Please contact your system administrator for further information on how to access :brandName using a Chrome or Edge browser."
          replacements={{ brandName }}
          data-testid="translatedtext-v9m5"
        />
      }
      data-testid="statuspagewithheroimage-k5dz"
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
    width: ${(props) => (props.$platformType === 'tablet' ? '371px' : '194px')}};
  }
  div {
    font-size: ${(props) => (props.$platformType === 'tablet' ? '18px' : '14px')}};
  }
`;

export const MobileStatusPage = ({ platformType }) => {
  const brandName = getBrandName();
  return (
    <MobileContainer $platformType={platformType} data-testid="mobilecontainer-qsvl">
      <Logo onClick={handleRefreshPage} size="140px" data-testid="logo-7r7o" />
      <ErrorDescription color="textTertiary" data-testid="errordescription-asrb">
        <TranslatedText
          stringId="splash.mobile.description"
          fallback=":brandName is not currently supported on mobile devices. Please access via a desktop computer, laptop, or tablet."
          replacements={{ brandName }}
          data-testid="translatedtext-9p7e"
        />
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
        <SingleTabErrorMessage data-testid="singletaberrormessage-g5ke">
          <TranslatedText
            stringId="splash.singleTab.message"
            fallback=":brandName can not be opened across multiple tabs."
            replacements={{ brandName }}
            data-testid="translatedtext-mala"
          />
        </SingleTabErrorMessage>
      }
      description={
        <TranslatedText
          stringId="splash.singleTab.description"
          fallback="Please continue working in the existing tab."
          replacements={{ brandName }}
          data-testid="translatedtext-rxi9"
        />
      }
      data-testid="statuspage-xadr"
    />
  );
};
