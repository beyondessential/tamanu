import React, { Component } from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import 'typeface-roboto';

import { ConnectedSidebar } from './components/Sidebar';
import { login, checkIsLoggedIn } from './store/auth';
import { LoginView } from './views';

const AppContainer = styled.div`
  display: flex;
`;

const AppContentsContainer = styled.div`
  height: 100vh;
  overflow-x: hidden;
  flex-grow: 1;
`;

class DumbApp extends Component {
  renderAppContents() {
    const { isUserLoggedIn } = this.props;
    if (!isUserLoggedIn) {
      return <LoginView {...this.props} />;
    }

    return (
      <AppContainer>
        <ConnectedSidebar />
        <AppContentsContainer>{this.props.children}</AppContentsContainer>
      </AppContainer>
    );
  }

  render() {
    return <div>{this.renderAppContents()}</div>;
  }
}

const mapStateToProps = state => ({ isUserLoggedIn: checkIsLoggedIn(state) });

const mapDispatchToProps = dispatch => ({
  onLogin: () => dispatch(login()),
});

export const App = connect(
  mapStateToProps,
  mapDispatchToProps,
)(DumbApp);
