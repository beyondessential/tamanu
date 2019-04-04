import React, { Component } from 'react';
import { connect } from 'react-redux';
import { ToastContainer, Slide } from 'react-toastify';
import styled from 'styled-components';
import 'typeface-roboto';

import Sidebar from '../components/Sidebar';
import actions from '../actions/auth';
import Login from './Auth/Login';


const { login: loginActions } = actions;
const { login } = loginActions;

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
  }

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
        <Sidebar />
        <AppContentsContainer>
          { this.props.children }
        </AppContentsContainer>
      </AppContainer>
    );
  }

  render() {
    return (
      <div>
        { this.renderAppContents() }
        <ToastContainer
          autoClose={3000}
          transition={Slide}
        />
      </div>
    );
  }
}

function mapStateToProps(state) {
  const { userId, secret, history } = state.auth;
  return { userId, secret, history };
}

const mapDispatchToProps = (dispatch) => ({
  login: (params) => dispatch(login(params)),
});

export default connect(mapStateToProps, mapDispatchToProps)(App);
