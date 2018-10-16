import React, { Component } from 'react';
import { connect } from 'react-redux';
import { ToastContainer, Slide } from 'react-toastify';
import Sidebar from '../components/Sidebar';
import actions from '../actions/auth';
import Login from './Auth/Login';

const { login: loginActions } = actions;
const { login } = loginActions;

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

  render() {
    const { userId, children } = this.props;
    return (
      <React.Fragment>
        {userId && <Sidebar />}
        {userId && children}
        {!userId &&
          <Login
            loginSubmit={this.props.login}
          />
        }
        <ToastContainer
          position="top-center"
          autoClose={3000}
          transition={Slide}
        />
      </React.Fragment>
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
