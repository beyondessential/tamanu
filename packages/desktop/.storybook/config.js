import React from 'react';
import { configure, addDecorator } from '@storybook/react';

import { ThemeProvider } from 'styled-components';
import { Colors } from '../app/constants';

import styled from 'styled-components';
import { CssBaseline } from '@material-ui/core';
import { MuiThemeProvider, StylesProvider } from '@material-ui/core/styles';
import { theme } from '../app/theme';

// automatically import all files ending in *.stories.js
const req = require.context('../stories', true, /stories.js$/);
function loadStories() {
  const keys = req
    .keys()
    .sort()
    .forEach(filename => req(filename));
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

addDecorator(story => (
  <StylesProvider injectFirst>
    <MuiThemeProvider theme={theme}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {story()}
      </ThemeProvider>
    </MuiThemeProvider>
  </StylesProvider>
));
