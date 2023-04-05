import React, { useState } from 'react';
import { DynamicSelectField } from '../app/components';
import { useApi, useSuggester } from '../app/api';
import { MockedApi } from './utils/mockedApi';

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
    name: {
      control: 'text',
    },
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

const Template = ({ name, suggesterEndpoint, ...args }) => {
  const testSuggester = useSuggester(suggesterEndpoint);
  const suggester = testSuggester.endpoint.includes('undefined') ? null : testSuggester;
  const [value, setValue] = useState(null);
  const handleChange = e => {
    setValue(e.target.value);
  };
  return (
    <DynamicSelectField
      field={{ name, onChange: handleChange, value }}
      suggester={suggester}
      {...args}
    />
  );
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

export const SevenOrLessItemsWithSuggester = Template.bind({});
SevenOrLessItemsWithSuggester.args = {
  name: 'lessThanSevenCities',
  suggesterEndpoint: 'lessThanSevenCities',
};

export const MoreThanSevenItemsWithSuggester = Template.bind({});
MoreThanSevenItemsWithSuggester.args = {
  name: 'moreThanSevenCities',
  suggesterEndpoint: 'moreThanSevenCities',
};
