import React from 'react';

const Button = () => {
  return <button>Testing</button>;
};

const meta = {
  component: Button,
};

export default meta;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
export const Primary = {
  render: () => <Button primary label="Button" />,
};
