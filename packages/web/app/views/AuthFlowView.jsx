import React from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import { Launch } from '@mui/icons-material';
import { Colors } from '../constants';
import { LogoDark } from '../components';
import { splashImages } from '../constants/images';
import { restartPasswordResetFlow } from '../store';
import { useApi } from '../api';
import { SyncHealthNotificationComponent } from '../components/SyncHealthNotification';
import { Typography } from '@mui/material';
import { getBrandId } from '../utils';
import { FULL_VERSION } from '../utils/env';

import { TranslatedText } from '../components/Translation/TranslatedText';

const Container = styled.div`
  display: flex;
  height: 100vh;
  justify-content: flex-start;
  align-items: center;
`;

const SplashImage = styled.div`
  max-width: 50vw;
  width: 50vw;
  height: inherit;
  background-image: url(${props => splashImages[props.brandId]});
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center right;
`;

const ContentContainer = styled.div`
  position: relative;
  padding: 30px 0 70px 0;
  width: 50vw;
  min-width: 500px;
  height: inherit;
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${Colors.white};
`;

const LogoContainer = styled.div`
  text-align: center;
  position: fixed;
  top: 25px;
  left: 25px;
  :hover {
    cursor: pointer;
  }
`;

const SupportDesktopLink = styled.a`
  position: absolute;
  bottom: 25px;
  left: 25px;
  margin-top: 4px;
  font-weight: 400;
  font-size: 9px;
  line-height: 15px;
  text-decoration: underline;
  color: ${Colors.darkestText};
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    font-weight: bold;
  }
`;

const FormContainer = styled.div`
  max-width: 400px;
  width: 100%;
  padding-top: 40px;
`;

const DesktopVersionText = styled(Typography)`
  font-size: 9px;
  color: ${Colors.midText};
  position: absolute;
  bottom: 15px;
  right: 20px;
`;

export const AuthFlowView = ({ children }) => {
  const api = useApi();
  const dispatch = useDispatch();
  const { agentVersion } = api;

  // TODO: This is a temp fix to get the support desk URL into the app. It will be updated in the settings project
  // const supportUrl = getLocalisation('supportDeskUrl');
  const supportUrl = 'https://bes-support.zendesk.com/hc/en-us';
  const isSupportUrlLoaded = !!supportUrl;

  const brandId = getBrandId();

  return (
    <Container data-testid="container-blhb">
      <ContentContainer data-testid="contentcontainer-hiui">
        <SyncHealthNotificationComponent data-testid="synchealthnotificationcomponent-lgpq" />
        <LogoContainer
          onClick={() => {
            window.location.reload();
            dispatch(restartPasswordResetFlow());
          }}
          data-testid="logocontainer-4v5o"
        >
          <LogoDark size="140px" data-testid="logodark-rd0a" />
        </LogoContainer>
        <FormContainer data-testid="formcontainer-5jm3">{children}</FormContainer>
        {isSupportUrlLoaded && (
          <SupportDesktopLink
            href={supportUrl}
            target="_blank"
            rel="noreferrer"
            data-testid="supportdesktoplink-ame2"
          >
            <TranslatedText
              stringId="externalLink.supportCentre"
              fallback="Support centre"
              data-testid="translatedtext-3n2u"
            />
            <Launch style={{ marginLeft: '3px', fontSize: '12px' }} data-testid="launch-rkkw" />
          </SupportDesktopLink>
        )}
        <DesktopVersionText title={FULL_VERSION} data-testid="desktopversiontext-55do">
          <TranslatedText
            stringId="login.version"
            fallback="Version"
            data-testid="translatedtext-pfqb"
          />{' '}
          {agentVersion}
        </DesktopVersionText>
      </ContentContainer>
      <SplashImage brandId={brandId} data-testid="splashimage-p5ox" />
    </Container>
  );
};
