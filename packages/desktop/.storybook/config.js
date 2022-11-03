import React from 'react';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configure, addDecorator, storiesOf } from '@storybook/react';
import styled, { ThemeProvider } from 'styled-components';
import { CssBaseline } from '@material-ui/core';
import { MuiThemeProvider, StylesProvider } from '@material-ui/core/styles';

import { API } from '../app/api/singletons';
import { initStore } from '../app/store';
import { Colors } from '../app/constants';
import { theme } from '../app/theme';
import { DummyElectronProvider } from '../app/contexts/Electron';

// automatically import all files ending in *.stories.js
const req = require.context('../stories', true, /stories\.js$/);
function loadStories() {
  const keys = req
    .keys()
    .sort()
    .forEach(filename => {
      try {
        req(filename);
      } catch (e) {
        storiesOf('ERROR DURING IMPORT', module).add(filename, () => (
          <div>
            <div>
              <strong>{e.toString()}</strong>
            </div>
            <pre>{e.stack}</pre>
          </div>
        ));
      }
    });
}

const NoteDisplay = styled.div`
  padding: 0.5rem 0.2rem;
  margin: 1rem 0.2rem;
  border: 1px solid ${Colors.outline};
  border-radius: 0.2rem;
  font-family: sans-serif;
`;

const NoteHeader = styled.div`
  color: #666;
  font-size: 10pt;
`;

configure(loadStories, module);
addDecorator((story, context, info) => {
  const note = context.parameters.note;
  if (!note) return story();

  return (
    <div>
      {story()}
      <NoteDisplay>
        <NoteHeader>Note:</NoteHeader>
        {note}
      </NoteDisplay>
    </div>
  );
});

const { store } = initStore(API);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

addDecorator(story => (
  <Provider store={store}>
    <StylesProvider injectFirst>
      <MuiThemeProvider theme={theme}>
        <ThemeProvider theme={theme}>
          <QueryClientProvider client={queryClient}>
            <DummyElectronProvider>
              <CssBaseline />
              {story()}
            </DummyElectronProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </MuiThemeProvider>
    </StylesProvider>
  </Provider>
));
