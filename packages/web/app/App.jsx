import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import 'typeface-roboto';
import { checkIsLoggedIn, checkIsFacilitySelected, getServerType } from './store/auth';
import { useLocation } from 'react-router';

import { TAMANU_COLORS } from '@tamanu/ui-components';
import { LoginView, FacilitySelectionView, SetupWizardView } from './views';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PromiseErrorBoundary } from './components/PromiseErrorBoundary';
import { ForbiddenErrorModal } from './components/ForbiddenErrorModal';
import {
  InitialSyncStatusPage,
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

// Whether the user has chosen to carry on while the records phase of a first sync finishes. Kept in
// session storage rather than component state so that navigating, or anything that remounts this
// layout, doesn't put the progress screen back in front of someone already working.
const ENTERED_DURING_INITIAL_SYNC = 'enteredDuringInitialSync';

export function App({ sidebar, children }) {
  const { data: serverStatus, isLoading } = useCheckServerAliveQuery();
  const isServerAlive = Boolean(serverStatus);
  const [hasEnteredDuringInitialSync, setHasEnteredDuringInitialSync] = useState(
    () => window?.sessionStorage?.getItem(ENTERED_DURING_INITIAL_SYNC) === 'true',
  );
  const isUserLoggedIn = useSelector(checkIsLoggedIn);
  const isFacilitySelected = useSelector(checkIsFacilitySelected);
  const location = useLocation();
  const serverType = useSelector(getServerType);
  const isPrimaryTab = useSingleTab();
  const disableSingleTab =
    window?.localStorage?.getItem('DISABLE_SINGLE_TAB') ||
    process.env.DISABLE_SINGLE_TAB === 'true';

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
  if (serverStatus?.setupRequired) return <SetupWizardView />;
  if (!isUserLoggedIn) return <LoginView />;

  // A facility part-way through its first sync can be logged into but not worked in: the boot phase
  // brings the facilities a user is matched against, and only once the catalogue phase lands is there
  // a patient list to work from. Sits ahead of facility selection because there may be no facility to
  // select yet, and because selecting one wouldn't help.
  const initialSyncPhase = serverStatus?.initialSyncPhase;
  const canEnterDuringInitialSync = initialSyncPhase === 'records';
  if (initialSyncPhase && !(canEnterDuringInitialSync && hasEnteredDuringInitialSync)) {
    return (
      <InitialSyncStatusPage
        phase={initialSyncPhase}
        canContinue={canEnterDuringInitialSync}
        onContinue={() => {
          window?.sessionStorage?.setItem(ENTERED_DURING_INITIAL_SYNC, 'true');
          setHasEnteredDuringInitialSync(true);
        }}
      />
    );
  }

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
