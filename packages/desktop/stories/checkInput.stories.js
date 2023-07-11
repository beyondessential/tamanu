import React, { useState } from 'react';
import { CheckInput } from '../app/components';

export default {
  argTypes: {
    error: {
      control: 'boolean',
    },
    value: {
      control: 'boolean',
    },
    label: {
      control: 'text',
    },
    helperText: {
      control: 'text',
    },
    name: {
      control: 'text',
    },
  },
  title: 'FormControls/CheckInput',
  component: CheckInput,
};

const Template = args => {
  const [value, setValue] = useState(null);
  const handleChange = () => {
    setValue(!value);
  };
  return (
    <div style={{ width: 300 }}>
      <CheckInput label="Check" {...args} value={value} onChange={handleChange} />
    </div>
  );
};

export const Default = Template.bind({});
Default.args = {};

export const Disabled = Template.bind({});
Disabled.args = {
  disabled: true,
};

export const WithHelpText = Template.bind({});
WithHelpText.args = {
  helperText: 'Here is some help text',
};

export const WithError = Template.bind({});
WithError.args = {
  error: true,
  helperText: 'Here is an error message',
};
