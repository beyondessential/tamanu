import React, { Component, Fragment } from 'react';
import styled from 'styled-components';
import { Grid, Paper } from '@material-ui/core';
import { TextField, Button, CheckField } from '../../components';
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
    const { email, password, rememberMe } = this.state;
    return (
      <Grid container justify="center" alignItems="center" style={{ minHeight: '100vh' }}>
        <Grid item xs={3}>
          <Paper elevation={0} style={{ padding: '0 24px 24px' }}>
            <LogoContainer>
              <TamanuLogo size="240px" />
            </LogoContainer>
            <form onSubmit={this.submitForm.bind(this)}>
              <Grid container spacing={16}>
                <Grid item xs={12}>
                  <TextField
                    name="email"
                    type="email"
                    label="Email"
                    value={email}
                    onChange={this.handleUserInput}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="password"
                    type="password"
                    label="Password"
                    value={password}
                    onChange={this.handleUserInput}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <CheckField
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
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Grid>
      </Grid>
    );
  }
}

export default Login;
