import React from 'react';
import { configure, addDecorator } from '@storybook/react';

import styled from 'styled-components';

// automatically import all files ending in *.stories.js
const req = require.context('../stories', true, /.stories.js$/);
function loadStories() {
  req.keys().forEach(filename => req(filename));
}

const NoteDisplay = styled.div`
  padding: 0.5rem 0.2rem;
  margin: 1rem 0;
  background: #eee;
  color: #555;
  font-family: sans-serif;
`;

const NoteHeader = styled.div`
  color: #666;
  font-size: 10pt;
`;

configure(loadStories, module);
addDecorator((story, context, info) => {
  const note = context.parameters.note;
  if(!note) return story();

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
