import React, { Component } from 'react';
import { connect } from 'react-redux';
import { ToastContainer, Slide } from 'react-toastify';
import styled from 'styled-components';

import Sidebar from '../components/Sidebar';
import actions from '../actions/auth';
import Login from './Auth/Login';


const { login: loginActions } = actions;
const { login } = loginActions;

const AppContainer = styled.div`
  display: flex;
`;

class App extends Component{
  state = {
    userId: null,
    loading: true,
  }

  componentWillMount() {
    this.handleChange();
  }

  componentWillReceiveProps(newProps) {
    this.handleChange(newProps);
  }

  handleChange(props = this.props) {
    console.log({ props });
  }

  renderAppContents() {
    if(!this.props.userId) {
      return <Login loginSubmit={this.props.login} />;
    }
      
    return (
      <AppContainer>
        <Sidebar />
        { this.props.children }
      </AppContainer>
    );
  }

  render() {
    const { userId, children } = this.props;
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
  const { userId, loading } = state.auth;
  return { userId, loading };
}

const mapDispatchToProps = (dispatch, ownProps) => ({
  login: (params) => dispatch(login(params)),
});

export default connect(mapStateToProps, mapDispatchToProps)(App);
