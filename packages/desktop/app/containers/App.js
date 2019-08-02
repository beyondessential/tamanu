import React, { Component } from 'react';
import { connect } from 'react-redux';
import { ToastContainer, Slide } from 'react-toastify';
import styled from 'styled-components';
import 'typeface-roboto';

import { ConnectedSidebar } from '../components/Sidebar';
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
  state = {
    userId: null,
  };

  componentWillMount() {
    this.handleChange();
  }

  componentWillReceiveProps(newProps) {
    this.handleChange(newProps);
  }

  handleChange(props = this.props) {
    const { userId, secret } = props;
    this.setState({ userId, secret });
  }

  renderAppContents() {
    const { userId, secret } = this.state;
    if (!userId || !secret) {
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

const mapStateToProps = state => {
  const { userId, secret, history } = state.auth;
  return { userId, secret, history };
};

const mapDispatchToProps = () => ({
  login: () => {
    throw new Error('Not implemented');
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(App);
