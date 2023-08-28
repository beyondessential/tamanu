import React, { useState } from 'react';
import { CheckInput } from '../app/components';
import { ExpandedMultiSelectField } from '../app/components/Field/ExpandedMultiSelectField';

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

export const MultiSelectField = () => {
  const [values, setValues] = useState([]);
  const handleChange = newValue => {
    setValues(newValue.target.value);
  };

  const options = [
    { label: 'Option 1', value: 'option1' },
    { label: 'Option 2', value: 'option2' },
    { label: 'Option 3', value: 'option3' },
    { label: 'Option 4', value: 'option4' },
  ];

  const field = {
    name: 'multiSelectFieldKey',
    value: values,
    onChange: handleChange,
  };

  return <ExpandedMultiSelectField options={options} field={field} />;
};
