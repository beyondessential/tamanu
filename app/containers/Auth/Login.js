import React, { Component, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { InputGroup } from '../../components';
import Serializer from '../../utils/form-serialize';

class Login extends Component {
  render() {
    const { loginSubmit } = this.props;
    return (
      <Fragment>
        <div className="content no-sidebar">
          <div className="view-top-bar">
            <span>
              Tamanu
            </span>
          </div>
          <div className="columns login-container">
            <div className="column is-3 login-form has-background-grey-lighter">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const data = Serializer.serialize(e.target, { hash: true });
                  loginSubmit(data);
                }}
              >
                <div className="is-size-3 has-text-centered m-b-15">Login</div>
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
                  <button type="submit" className="button is-primary">Login</button>
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
