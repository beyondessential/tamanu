import React, { Component, Fragment } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

import { InputGroup } from '../../components';
import { Button } from '../../components/Button';
import { TamanuLogo } from '../../components/TamanuLogo';

import Serializer from '../../utils/form-serialize';


const LogoContainer = styled.div`
  text-align: center;
`;

class Login extends Component {

  componentDidMount() {
    const { loginSubmit } = this.props;

    // allow dev environment to automatically provide credentials
    // (save typing it in every time the app reloads)
    const email = process.env.SKIP_LOGIN_EMAIL;
    const password = process.env.SKIP_LOGIN_PASSWORD;

    if(email && password) {
      loginSubmit({ email, password });
    }
  }

  render() {
    const { loginSubmit } = this.props;
    return (
      <Fragment>
        <div className="content no-sidebar">
          <div className="columns login-container">
            <div className="column is-3 login-form has-background-grey-lighter">
              <LogoContainer>
                <TamanuLogo size="240px" />
              </LogoContainer>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const data = Serializer.serialize(e.target, { hash: true });
                  loginSubmit(data);
                }}
              >
                <InputGroup
                  className="m-b-0 column"
                  name="email"
                  type="email"
                  label={false}
                  placeholder="Email"
                  required
                />
                <InputGroup
                  className="m-b-0 column"
                  name="password"
                  type="password"
                  label={false}
                  placeholder="Password"
                  required
                />
                <div className="column has-text-right">
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                  >Login</Button>
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
