import React, { Component } from 'react';
import { Provider } from 'react-redux';
import { HashRouter as Router } from 'react-router-dom';
import { PersistGate } from 'redux-persist/integration/react'

import Routes from '../routes';
import { initClient } from '../utils';
import Preloader from '../components/Preloader';
import { ThemeProvider } from '../components/ThemeProvider';

export default class Root extends Component {
  render() {
    const {
      store,
      persistor
    } = this.props;

    return (
      <Provider store={store}>
        <PersistGate
          loading={<Preloader />}
          persistor={persistor}
          onBeforeLift={initClient()}
        >
          <Router>
            <ThemeProvider>
              <Routes />
            </ThemeProvider>
          </Router>
        </PersistGate>
      </Provider>
    );
  }
};
