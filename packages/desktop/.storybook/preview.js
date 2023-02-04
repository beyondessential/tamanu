import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'styled-components';
import { CssBaseline } from '@material-ui/core';
import { MuiThemeProvider, StylesProvider } from '@material-ui/core/styles';
import { DummyElectronProvider } from '../app/contexts/Electron';

import React, { useEffect } from 'react';
import { initStore } from '../app/store';
import { theme } from '../app/theme';
import { API } from '../app/api/singletons';
import { Provider, useDispatch } from 'react-redux';
import { ConnectedRouter } from 'connected-react-router';
import {Buffer} from 'buffer'

window.Buffer = Buffer

const { store, history } = initStore(API);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

export const decorators = [
  Story => {
    return (
      <Provider store={store}>
        <ConnectedRouter history={history}>
          <StylesProvider injectFirst>
            <MuiThemeProvider theme={theme}>
              <ThemeProvider theme={theme}>
                <QueryClientProvider client={queryClient}>
                  <DummyElectronProvider>
                    <CssBaseline />
                    <Story />
                  </DummyElectronProvider>
                </QueryClientProvider>
              </ThemeProvider>
            </MuiThemeProvider>
          </StylesProvider>
        </ConnectedRouter>
      </Provider>
    );
  },
];
