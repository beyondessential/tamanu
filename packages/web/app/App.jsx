import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import Bowser from 'bowser';
import 'typeface-roboto';
import { Colors } from './constants';
import { checkIsLoggedIn } from './store/auth';
import { getCurrentRoute } from './store/router';
import { LoginView } from './views';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PromiseErrorBoundary } from './components/PromiseErrorBoundary';
import { ForbiddenErrorModal } from './components/ForbiddenErrorModal';
import {
  LoadingStatusPage,
  UnavailableStatusPage,
  UnsupportedBrowserStatusPage,
  MobileStatusPage,
} from './components/StatusPage';
import { useCheckServerAliveQuery } from './api/queries/useCheckServerAliveQuery';
import { useSingleTab } from './singleTab/singleTab';
import { MultiTabErrorScreen } from './singleTab/MultiTabErrorScreen';

const AppContainer = styled.div`
  display: flex;
  background: #f7f9fb;
`;

const AppContentsContainer = styled.div`
  height: 100vh;
  overflow: auto;
  flex: 1;
  border-top: 1px solid ${Colors.softOutline};
`;

export function App({ sidebar, children }) {
  const { data: isServerAlive, isLoading } = useCheckServerAliveQuery();
  const isUserLoggedIn = useSelector(checkIsLoggedIn);
  const currentRoute = useSelector(getCurrentRoute);
  const isPrimaryTab = useSingleTab();
  const disableSingleTab = localStorage.getItem('DISABLE_SINGLE_TAB');

  if (!isPrimaryTab && !disableSingleTab) {
    return <MultiTabErrorScreen />;
  }

  const browser = Bowser.getParser(window.navigator.userAgent);
  const isChrome = browser.satisfies({
    chrome: '>=88.0.4324.109', // Early 2021 release of chrome. Arbitrarily chosen as recentish.
  });
  const platformType = browser.getPlatformType();
  const isDesktop = platformType === 'desktop';
  const isDebugMode = localStorage.getItem('DEBUG_PROD');

  if (!isDebugMode) { // Skip browser/platform check in debug mode
    if (!isDesktop) return <MobileStatusPage platformType={platformType} />;
    if (!isChrome) return <UnsupportedBrowserStatusPage />;
  }
  if (isLoading) return <LoadingStatusPage />;
  if (!isServerAlive) return <UnavailableStatusPage />;
  if (!isUserLoggedIn) return <LoginView />;

  return (
    <AppContainer>
      {sidebar}
      <PromiseErrorBoundary>
        <ErrorBoundary errorKey={currentRoute}>
          <AppContentsContainer>
            {children}
            <ForbiddenErrorModal />
          </AppContentsContainer>
        </ErrorBoundary>
      </PromiseErrorBoundary>
    </AppContainer>
  );
}
