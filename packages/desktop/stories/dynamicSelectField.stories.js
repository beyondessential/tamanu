import React, { useState } from 'react';
import styled from 'styled-components';
import { DynamicSelectField } from '../app/components';
import { useSuggester } from '../app/api';

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

const Container = styled.div`
  padding: 1rem;
  max-width: 500px;
`;

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
  const suggester = useSuggester(suggesterEndpoint);
  const [value, setValue] = useState(null);
  const handleChange = e => {
    setValue(e.target.value);
  };
  return (
    <Container>
      <DynamicSelectField
        field={{ name, onChange: handleChange, value }}
        suggester={suggesterEndpoint ? suggester : null}
        {...args}
      />
    </Container>
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
