import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import 'typeface-roboto';
import { Colors } from './constants';
import { checkIsLoggedIn } from './store/auth';
import { getCurrentRoute } from './store/router';
import { LoginView } from './views';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PromiseErrorBoundary } from './components/PromiseErrorBoundary';
import { ForbiddenErrorModal } from './components/ForbiddenErrorModal';
import { LoadingStatusPage, StatusPage, UnavailableStatusPage } from './components/StatusPage';
import { useConnectionAliveQuery } from './api/queries/useConnectionAliveQuery';

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
  const { data: connectionAlive, isLoading } = useConnectionAliveQuery();
  const isUserLoggedIn = useSelector(checkIsLoggedIn);
  const currentRoute = useSelector(getCurrentRoute);

  if (isLoading) return <LoadingStatusPage />;
  if (!connectionAlive) return <UnavailableStatusPage />;
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
