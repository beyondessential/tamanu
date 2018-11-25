import React, { Component } from 'react';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'react-router-redux';
import Routes from '../routes';

import { ThemeProvider } from '../components/ThemeProvider';

export default class Root extends Component {
  render() {
    const { store, history } = this.props;
    return (
      <Provider store={store}>
        <ConnectedRouter history={history}>
          <ThemeProvider>
            <Routes />
          </ThemeProvider>
        </ConnectedRouter>
      </Provider>
    );
  }
};
