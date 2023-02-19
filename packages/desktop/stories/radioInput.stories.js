import React, { useState } from 'react';
import { RadioInput } from '../app/components';

const FRUITS = [
  { value: 'apples', label: 'Apples' },
  { value: 'oranges', label: 'Oranges' },
  { value: 'bananas', label: 'Bananas' },
];

const DEFAULT_PROPS = {
  options: FRUITS,
  label: 'fruit',
};

export default {
  argTypes: {
    options: {
      control: {
        type: 'array',
      },
    },
    fullWidth: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
    error: {
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
  title: 'FormControls/RadioInput',
  component: RadioInput,
};

const Template = args => {
  const [value, setValue] = useState(null);
  const handleChange = e => {
    setValue(e.target.value);
  };
  return <RadioInput {...args} value={value} onChange={handleChange} />;
};

export const Default = Template.bind({});
Default.args = {
  ...DEFAULT_PROPS,
};

export const Required = Template.bind({});
Required.args = {
  ...DEFAULT_PROPS,
  required: true,
};

export const Disabled = Template.bind({});
Disabled.args = {
  ...DEFAULT_PROPS,
  disabled: true,
};

export const WithHelpText = Template.bind({});
WithHelpText.args = {
  ...DEFAULT_PROPS,
  helperText: 'Here is some help text',
};

export const WithError = Template.bind({});
WithError.args = {
  ...DEFAULT_PROPS,
  error: true,
  helperText: 'Here is an error message',
};

export const WithDescriptions = Template.bind({});
WithDescriptions.args = {
  ...DEFAULT_PROPS,
  options: FRUITS.slice(0, 2).map(option => ({
    ...option,
    description: `Some descriptive information about the ${option.label}`,
  })),
};
