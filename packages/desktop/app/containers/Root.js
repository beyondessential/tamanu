import React from 'react';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'react-router-redux';
import { PersistGate } from 'redux-persist/integration/react';
import PropTypes from 'prop-types';
import { CssBaseline } from '@material-ui/core';
import Routes from '../routes';
import { initClient } from '../utils';
import Preloader from '../components/Preloader';
import { ThemeProvider } from '../components/ThemeProvider';

export default function Root({ store, history, persistor }) {
  return (
    <Provider store={store}>
      <PersistGate
        loading={<Preloader />}
        persistor={persistor}
        onBeforeLift={initClient()}
      >
        <ConnectedRouter history={history}>
          <ThemeProvider>
            <CssBaseline />
            <Routes />
          </ThemeProvider>
        </ConnectedRouter>
      </PersistGate>
    </Provider>
  );
}

Root.propTypes = {
  store: PropTypes.instanceOf(Object).isRequired,
  history: PropTypes.instanceOf(Object).isRequired,
  persistor: PropTypes.instanceOf(Object).isRequired,
};
