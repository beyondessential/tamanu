import React, { useState } from 'react';
import { RadioInput } from '../app/components';

const FRUITS = [
  { value: 'apples', label: 'Apples' },
  { value: 'oranges', label: 'Oranges' },
  { value: 'bananas', label: 'Bananas' },
];

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
  return (
    <RadioInput options={FRUITS} label="fruit" {...args} value={value} onChange={handleChange} />
  );
};

export const Default = Template.bind({});
Default.args = {};

export const Required = Template.bind({});
Required.args = {
  required: true,
};

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

export const WithDescriptions = Template.bind({});
WithDescriptions.args = {
  options: FRUITS.slice(0, 2).map(option => ({
    ...option,
    description: `Some descriptive information about the ${option.label}`,
  })),
};

export const WithColors = Template.bind({});
WithColors.args = {
  options: FRUITS.slice(0, 2).map((option, i) => ({
    ...option,
    color: ['#FF0000', '#00FF00'][i],
  })),
};
