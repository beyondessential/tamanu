import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
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
import { useBrowserSupport } from './api/queries/useBrowserSupport';
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
    window?.localStorage?.getItem('DISABLE_SINGLE_TAB') || process.env.DISABLE_SINGLE_TAB === 'true';

  // Browser/device support is decided server-side against configurable settings
  // (see the /public/browser-support endpoint), so it can be loosened/tightened
  // per deployment. Falls back to the static build-time check on error/timeout.
  // DEBUG_PROD bypasses the gate entirely.
  const isDebugMode = window?.localStorage?.getItem('DEBUG_PROD');
  const {
    status: browserSupportStatus,
    reason: unsupportedReason,
    descriptor,
  } = useBrowserSupport({ enabled: !isDebugMode });

  if (!isDebugMode) {
    if (browserSupportStatus === 'loading') return <LoadingStatusPage />;
    if (browserSupportStatus === 'unsupported') {
      return unsupportedReason === 'platform' ? (
        <MobileStatusPage platformType={descriptor.platformType} />
      ) : (
        <UnsupportedBrowserStatusPage />
      );
    }
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
