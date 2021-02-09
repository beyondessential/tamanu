import React, { Component } from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import 'typeface-roboto';

import { TamanuLogoWhite } from './components/TamanuLogo';
import { ConnectedSidebar } from './components/Sidebar';
import { Appbar } from './components/Appbar';
import { login, checkIsLoggedIn } from './store/auth';
import { getCurrentRoute } from './store/router';
import { ConnectedLoginView } from './views';
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

class DumbApp extends Component {
  renderAppContents() {
    const { isUserLoggedIn, currentRoute } = this.props;
    if (!isUserLoggedIn) {
      return <ConnectedLoginView {...this.props} />;
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
            {this.props.children}
            <DecisionSupportModal />
          </AppContentsContainer>
        </ErrorBoundary>
      </AppContainer>
    );
  }

  render() {
    return <div>{this.renderAppContents()}</div>;
  }
}

const mapStateToProps = state => ({
  isUserLoggedIn: checkIsLoggedIn(state),
  currentRoute: getCurrentRoute(state),
});

const mapDispatchToProps = dispatch => ({
  onLogin: ({ email, password }) => dispatch(login(email, password)),
});

export const App = connect(mapStateToProps, mapDispatchToProps)(DumbApp);
