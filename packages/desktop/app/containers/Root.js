import React, { Component } from 'react';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'react-router-redux';
import { PersistGate } from 'redux-persist/integration/react'

import Routes from '../routes';
import { initClient } from '../utils';
import Preloader from '../components/Preloader';
import { ThemeProvider } from '../components/ThemeProvider';

export default class Root extends Component {
  render() {
    const {
      store,
      history,
      persistor
    } = this.props;

    return (
      <Provider store={store}>
        <PersistGate
          loading={<Preloader />}
          persistor={persistor}
          onBeforeLift={initClient()}
        >
          <ConnectedRouter history={history}>
            <ThemeProvider>
              <Routes />
            </ThemeProvider>
          </ConnectedRouter>
        </PersistGate>
      </Provider>
    );
  }
};
