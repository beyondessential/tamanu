import React, { useState } from 'react';
import { DynamicSelectField } from '../app/components';

const FRUITS = [
  { value: 'apples', label: 'Apples' },
  { value: 'oranges', label: 'Oranges' },
  { value: 'bananas', label: 'Bananas' },
];

const FURNITURE = [
  { label: 'Sofa', value: 'sofa' },
  { label: 'Armchair', value: 'armchair' },
  { label: 'Coffee Table', value: 'coffeeTable' },
  { label: 'End Table', value: 'endTable' },
  { label: 'Dining Table', value: 'diningTable' },
  { label: 'Dining Chair', value: 'diningChair' },
  { label: 'Bed', value: 'bed' },
  { label: 'Dresser', value: 'dresser' },
  { label: 'Nightstand', value: 'nightstand' },
  { label: 'Bookshelf', value: 'bookshelf' },
];

export default {
  argTypes: {
    label: {
      control: 'text',
    },
    disabled: {
      control: 'boolean',
    },
  },
  title: 'FormControls/DynamicSelectField',
  component: DynamicSelectField,
};

const Template = ({ name, ...args }) => {
  const [value, setValue] = useState(null);
  const handleChange = e => {
    setValue(e.target.value);
  };
  return <DynamicSelectField field={{ name, onChange: handleChange, value }} {...args} />;
};

export const SevenOrLessItems = Template.bind({});
SevenOrLessItems.args = {
  name: 'fruit',
  options: FRUITS,
};

export const MoreThanSevenItems = Template.bind({});
MoreThanSevenItems.args = {
  name: 'furniture',
  options: FURNITURE,
};
