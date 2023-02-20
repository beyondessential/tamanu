import { action } from '@storybook/addon-actions';
import React from 'react';
import { TestSelectorInput } from '../app/components/LabRequest/IndividualTestSelector';
import { MockedApi } from './utils/mockedApi';

const testTypes = [
  { name: 'Grape', id: 'grape', labTestCategoryId: 'Sweet' },
  { name: 'Vanilla', id: 'vanilla', labTestCategoryId: 'Sweet' },
  { name: 'Chocolate', id: 'chocolate', labTestCategoryId: 'Sweet' },
  { name: 'Boysenberry', id: 'boysenberry', labTestCategoryId: 'Sweet' },
  { name: 'Strawberry', id: 'strawb', labTestCategoryId: 'Sweet' },
  { name: 'Lemon', id: 'lemon', labTestCategoryId: 'Sweet' },
  { name: 'Pepper', id: 'pepper', labTestCategoryId: 'Savoury' },
  { name: 'Cabbage', id: 'cabbage', labTestCategoryId: 'Savoury' },
  { name: 'Sprout', id: 'sprout', labTestCategoryId: 'Savoury' },
  { name: 'Yeast', id: 'yeast', labTestCategoryId: 'Savoury' },
  { name: 'Zucchini', id: 'zuc', labTestCategoryId: 'Savoury' },
  { name: 'Egg', id: 'egg', labTestCategoryId: 'Savoury' },
  { name: 'Chicken', id: 'chicken', labTestCategoryId: 'Savoury' },
  { name: 'Leek', id: 'leek', labTestCategoryId: 'Savoury' },
  { name: 'Chilli', id: 'chilli', labTestCategoryId: 'Savoury' },
  { name: 'Fennel', id: 'fennel', labTestCategoryId: 'Savoury' },
];

export default {
  title: 'TestSelector/Individual',
  component: TestSelectorInput,
};

const endpoints = {
  'suggestions/labTestCategory/:query': () => [
    { id: 'Savoury', name: 'Savoury' },
    { id: 'Sweet', name: 'Sweet' },
  ],
};

const Template = args => {
  const [selected, setSelected] = React.useState([]);
  const changeAction = action('change');
  const onChange = React.useCallback(
    e => {
      const newValue = e.target.value;
      changeAction(newValue);
      setSelected(newValue);
    },
    [setSelected, changeAction],
  );

  return (
    <MockedApi endpoints={endpoints}>
      <div style={{ width: 800, height: 500 }}>
        <TestSelectorInput
          testTypes={testTypes}
          selected={selected}
          onChange={onChange}
          {...args}
        />
      </div>
    </MockedApi>
  );
};

export const Default = Template.bind({});
Default.args = {};
