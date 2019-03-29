import React from 'react';
import { configure, addDecorator } from '@storybook/react';

// automatically import all files ending in *.stories.js
const req = require.context('../stories', true, /.stories.js$/);
function loadStories() {
  req.keys().forEach(filename => req(filename));
}

configure(loadStories, module);
addDecorator((story, context, info) => {
  const note = context.parameters.note;
  if(!note) return story();

  return (
    <div> 
      {story()}
      <hr />
      <div>{note}</div>
    </div>
  );
});
