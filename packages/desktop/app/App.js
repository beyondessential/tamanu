import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import 'typeface-roboto';

import { TamanuLogoWhite } from './components/TamanuLogo';
import { ConnectedSidebar } from './components/Sidebar';
import { Appbar } from './components/Appbar';
import { checkIsLoggedIn } from './store/auth';
import { getCurrentRoute } from './store/router';
import { LoginView } from './views';
import { Colors } from './constants';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DecisionSupportModal } from './components/DecisionSupportModal';

const AppContainer = styled.div`
  height: 100vh;
  display: grid;
  background: #f7f9fb;
  grid-template-columns: 1fr 4fr;
  grid-template-rows: 64px auto;
`;

const AppContentsContainer = styled.div`
  overflow-x: hidden;
  flex-grow: 1;
  grid-row: 2 / -1;
  grid-column: 2 / -1;
`;

const AppBadge = styled.div`
  grid-row: 1 / 2;
  grid-column: 1 / 2;
  background: ${Colors.primary};
  display: flex;
  z-index: 1101;
  box-shadow: 1px 0px 4px rgba(0, 0, 0, 0.15);
  padding-left: 16px;
`;

export function App({ children }) {
  const dispatch = useDispatch();
  const isUserLoggedIn = useSelector(checkIsLoggedIn);
  const currentRoute = useSelector(getCurrentRoute);
  if (!isUserLoggedIn) {
    return <LoginView />;
  }

  return (
    <AppContainer>
      <AppBadge>
        <TamanuLogoWhite />
      </AppBadge>
      <Appbar />
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
