import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import 'typeface-roboto';

import { checkIsLoggedIn } from './store/auth';
import { getCurrentRoute } from './store/router';
import { LoginView } from './views';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DecisionSupportModal } from './components/DecisionSupportModal';

const AppContainer = styled.div`
  display: flex;
  background: #f7f9fb;
`;

const AppContentsContainer = styled.div`
  height: 100vh;
  overflow: auto;
  flex: 1;
`;

const Hash = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  z-index: 9999999;
  background: transparent;
  padding: 1rem;
  width: 400px;
  pointer-events: none;
`;

export function App({ sidebar, children }) {
  const isUserLoggedIn = useSelector(checkIsLoggedIn);
  const currentRoute = useSelector(getCurrentRoute);
  if (!isUserLoggedIn) {
    return <LoginView />;
  }

  return (
    <AppContainer>
      {/** REMOVE REMOVE REMOVE REMOVE */}
      <Hash>{window.location.hash}</Hash>
      {/** WARNING WARNING WARNING WARNING */}
      {sidebar}
      <ErrorBoundary errorKey={currentRoute}>
        <AppContentsContainer>
          {children}
          <DecisionSupportModal />
        </AppContentsContainer>
      </ErrorBoundary>
    </AppContainer>
  );
}
