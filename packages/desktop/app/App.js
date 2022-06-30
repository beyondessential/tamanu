import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import 'typeface-roboto';

import { checkIsLoggedIn } from './store/auth';
import { getCurrentRoute } from './store/router';
import { LoginView } from './views';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DecisionSupportModal } from './components/DecisionSupportModal';
import { ForbiddenErrorModal } from './components/ForbiddenErrorModal';

const AppContainer = styled.div`
  display: flex;
  background: #f7f9fb;
`;

const AppContentsContainer = styled.div`
  height: 100vh;
  overflow: auto;
  flex: 1;
`;

export function App({ sidebar, children }) {
  const isUserLoggedIn = useSelector(checkIsLoggedIn);
  const currentRoute = useSelector(getCurrentRoute);
  if (!isUserLoggedIn) {
    return <LoginView />;
  }

  return (
    <AppContainer>
      {sidebar}
      <ErrorBoundary errorKey={currentRoute}>
        <AppContentsContainer>
          {children}
          <DecisionSupportModal />
          <ForbiddenErrorModal />
        </AppContentsContainer>
      </ErrorBoundary>
    </AppContainer>
  );
}
