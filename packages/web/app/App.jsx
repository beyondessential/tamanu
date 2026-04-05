import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import Bowser from 'bowser';
import { IconButton } from '@material-ui/core';
import { ChatBubbleOutline } from '@material-ui/icons';
import { AskAiPanel } from './components/AskAi';
import 'typeface-roboto';
import { Colors } from './constants';
import { checkIsLoggedIn, checkIsFacilitySelected, getServerType } from './store/auth';
import { useLocation } from 'react-router';
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
import { useAskAiStatusQuery } from './api/queries/useAskAiStatusQuery';
import { useSingleTab } from './utils/singleTab';
import { SERVER_TYPES } from '@tamanu/constants';

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

const AskAiFab = styled(IconButton)`
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 48px;
  height: 48px;
  background: ${Colors.primaryDark};
  color: white;
  z-index: 1200;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);

  &:hover {
    background: #4e5f71;
  }
`;

export function App({ sidebar, children }) {
  const [askAiOpen, setAskAiOpen] = useState(false);
  const { data: isServerAlive, isLoading } = useCheckServerAliveQuery();
  const isUserLoggedIn = useSelector(checkIsLoggedIn);
  const isFacilitySelected = useSelector(checkIsFacilitySelected);
  const isFacilityReady = isUserLoggedIn && isFacilitySelected;
  const { data: askAiStatus } = useAskAiStatusQuery({ enabled: isFacilityReady });
  const isAskAiEnabled = Boolean(askAiStatus?.enabled);
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
      {isAskAiEnabled && (
        <>
          <AskAiFab onClick={() => setAskAiOpen(o => !o)} title="Chat">
            <ChatBubbleOutline fontSize="small" />
          </AskAiFab>
          <AskAiPanel open={askAiOpen} onClose={() => setAskAiOpen(false)} />
        </>
      )}
    </AppContainer>
  );
}
