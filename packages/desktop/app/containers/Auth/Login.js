import React, { Component, Fragment } from 'react';
import styled from 'styled-components';

import { InputGroup, Button, CheckboxGroup } from '../../components';
import { TamanuLogo } from '../../components/TamanuLogo';
import { history } from '../../utils';
import { REMEMBER_EMAIL_KEY } from '../../constants';

const LogoContainer = styled.div`
  text-align: center;
`;

class Login extends Component {
  state = {
    email: '',
    password: '',
    rememberMe: false,
  }

  componentDidMount() {
    const { userId, secret } = this.props;
    if (userId && secret) history.push('/');

    const rememberEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);
    if (rememberEmail) this.setState({ email: rememberEmail, rememberMe: true });
  }

  handleUserInput = (e, field) => {
    const form = {};
    if (typeof field !== 'undefined') {
      form[field] = e;
    } else {
      const { name } = e.target;
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      form[name] = value;
    }
    this.setState(form);
  }

  submitForm(e) {
    e.preventDefault();
    const { login } = this.props;
    const { email, rememberMe } = this.state;
    if (rememberMe) {
      localStorage.setItem(REMEMBER_EMAIL_KEY, email);
    } else {
      localStorage.removeItem(REMEMBER_EMAIL_KEY);
    }
    login(this.state);
  }

  render() {
    const { email, rememberMe } = this.state;

    return (
      <Fragment>
        <div className="content no-sidebar">
          <div className="columns login-container">
            <div className="column is-3 login-form has-background-grey-lighter">
              <LogoContainer>
                <TamanuLogo size="240px" />
              </LogoContainer>
              <form onSubmit={this.submitForm.bind(this)}>
                <InputGroup
                  className="m-b-0 column"
                  name="email"
                  type="email"
                  label={false}
                  placeholder="Email"
                  value={email}
                  onChange={this.handleUserInput}
                  required
                />
                <InputGroup
                  className="m-b-0 column"
                  name="password"
                  type="password"
                  label={false}
                  placeholder="Password"
                  onChange={this.handleUserInput}
                  required
                />
                <div className="columns p-r-15">
                  <CheckboxGroup
                    className="column is-half p-l-25 p-t-20 p-b-0"
                    name="rememberMe"
                    value="yes"
                    label="Remember me"
                    checked={rememberMe}
                    onChange={this.handleUserInput}
                  />
                  <div className="column is-half has-text-right">
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                    >
Login
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Fragment>
    );
  }
}

export default Login;
