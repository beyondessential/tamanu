import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import Bowser from 'bowser';
import 'typeface-roboto';
import { checkIsLoggedIn, checkIsFacilitySelected, getServerType } from './store/auth';
import { useLocation } from 'react-router';

import { TAMANU_COLORS } from '@tamanu/ui-components';
import { LoginView, FacilitySelectionView } from './views';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PromiseErrorBoundary } from './components/PromiseErrorBoundary';
import { ForbiddenErrorModal } from './components/ForbiddenErrorModal';
import {
  LoadingStatusPage,
  UnavailableStatusPage,
  UnsupportedBrowserStatusPage,
  MobileStatusPage,
  SingleTabStatusPage,
} from './components/StatusPage';
import { useCheckServerAliveQuery } from './api/queries/useCheckServerAliveQuery';
import { useSingleTab } from './utils/singleTab';
import { MIN_CHROME_VERSION } from './utils/env';
import { SERVER_TYPES } from '@tamanu/constants';

const AppContainer = styled.div`
  display: flex;
  background: ${TAMANU_COLORS.background2};
`;

const AppContentsContainer = styled.div`
  height: 100dvh;
  overflow: auto;
  flex: 1;
`;

export function App({ sidebar, children }) {
  const { data: isServerAlive, isLoading } = useCheckServerAliveQuery();
  const isUserLoggedIn = useSelector(checkIsLoggedIn);
  const isFacilitySelected = useSelector(checkIsFacilitySelected);
  const location = useLocation();
  const serverType = useSelector(getServerType);
  const isPrimaryTab = useSingleTab();
  const disableSingleTab =
    localStorage.getItem('DISABLE_SINGLE_TAB') || process.env.DISABLE_SINGLE_TAB === 'true';

  const browser = Bowser.getParser(window.navigator.userAgent);
  // Accept any sufficiently recent Chromium-based browser (Chrome, Edge, Brave,
  // Opera, Vivaldi, Yandex, ...) by checking the real Blink engine version. We
  // can't use bowser's per-browser version: branded Chromium browsers report
  // their own product version (e.g. "Opera 120"), not the Chromium major — but
  // they all carry the true Chromium major in a Chrome/Chromium/HeadlessChrome UA
  // token (some Linux and headless builds expose Chromium/ or HeadlessChrome/
  // rather than Chrome/). MIN_CHROME_VERSION is resolved at build time (see
  // vite.config.js) so the gate rolls forward with each release branch.
  // Safari/Firefox aren't Blink and lack the token, so they remain unsupported.
  const chromiumVersionMatch = /(?:HeadlessChrome|Chromium|Chrome)\/(\d+)/.exec(
    window.navigator.userAgent,
  );
  const chromiumMajor = chromiumVersionMatch ? Number(chromiumVersionMatch[1]) : null;
  const isChromish =
    browser.getEngineName() === 'Blink' &&
    chromiumMajor !== null &&
    chromiumMajor >= MIN_CHROME_VERSION;
  const platformType = browser.getPlatformType();
  const isMobile = platformType === 'mobile';
  const isDebugMode = localStorage.getItem('DEBUG_PROD');

  if (!isDebugMode) {
    // Skip browser/platform check in debug mode
    if (isMobile) return <MobileStatusPage platformType={platformType} />;
    if (!isChromish) return <UnsupportedBrowserStatusPage />;
  }
  if (!isPrimaryTab && !disableSingleTab) return <SingleTabStatusPage />;
  if (isLoading) return <LoadingStatusPage />;
  if (!isServerAlive) return <UnavailableStatusPage />;
  if (!isUserLoggedIn) return <LoginView />;
  if (serverType === SERVER_TYPES.FACILITY && !isFacilitySelected) return <FacilitySelectionView />;

  return (
    <AppContainer>
      {sidebar}
      <PromiseErrorBoundary>
        <ErrorBoundary errorKey={location.pathname}>
          <AppContentsContainer>
            {children}
            <ForbiddenErrorModal />
          </AppContentsContainer>
        </ErrorBoundary>
      </PromiseErrorBoundary>
    </AppContainer>
  );
}
