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
  // Early 2022 releases. Arbitrarily chosen as recentish.
  const isChromish = browser.satisfies({
    chrome: '>=100',
    chromium: '>=100',
    edge: '>=100',
  });
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
