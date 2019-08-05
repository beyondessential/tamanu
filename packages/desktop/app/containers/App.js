import React, { Component } from 'react';
import { connect } from 'react-redux';
import { ToastContainer, Slide } from 'react-toastify';
import styled from 'styled-components';
import 'typeface-roboto';

import { ConnectedSidebar } from '../components/Sidebar';
import { login, checkIsLoggedIn } from '../auth';
import Login from './Auth/Login';

const AppContainer = styled.div`
  display: flex;
`;

const AppContentsContainer = styled.div`
  height: 100vh;
  overflow-x: hidden;
  flex-grow: 1;
`;

class App extends Component {
  renderAppContents() {
    const { isUserLoggedIn } = this.props;
    if (!isUserLoggedIn) {
      return <Login {...this.props} />;
    }

    return (
      <AppContainer>
        <ConnectedSidebar />
        <AppContentsContainer>{this.props.children}</AppContentsContainer>
      </AppContainer>
    );
  }

  render() {
    return (
      <div>
        {this.renderAppContents()}
        <ToastContainer autoClose={3000} transition={Slide} />
      </div>
    );
  }
}

const mapStateToProps = state => ({ isUserLoggedIn: checkIsLoggedIn(state) });

const mapDispatchToProps = dispatch => ({
  onLogin: () => dispatch(login()),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(App);
