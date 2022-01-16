import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import 'typeface-roboto';

import { ConnectedSidebar } from './components/Sidebar';
import { checkIsLoggedIn } from './store/auth';
import { getCurrentRoute } from './store/router';
import { LoginView } from './views';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DecisionSupportModal } from './components/DecisionSupportModal';

const AppContainer = styled.div`
  height: 100vh;
  display: grid;
  background: #f7f9fb;
  grid-template-columns: 1fr 4fr;
`;

const AppContentsContainer = styled.div`
  overflow-x: hidden;
  flex-grow: 1;
  grid-row: 2 / -1;
  grid-column: 2 / -1;
`;

export function App({ children }) {
  const isUserLoggedIn = useSelector(checkIsLoggedIn);
  const currentRoute = useSelector(getCurrentRoute);
  if (!isUserLoggedIn) {
    return <LoginView />;
  }

  return (
    <AppContainer>
      <ConnectedSidebar />
      <ErrorBoundary errorKey={currentRoute}>
        <AppContentsContainer>
          {children}
          <DecisionSupportModal />
        </AppContentsContainer>
      </ErrorBoundary>
    </AppContainer>
  );
}
