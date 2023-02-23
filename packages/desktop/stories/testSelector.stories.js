import { action } from '@storybook/addon-actions';
import React from 'react';
import { LAB_REQUEST_SELECT_LAB_METHOD } from 'shared/constants/labs';
import { TestSelectorInput } from '../app/components/LabRequest/TestSelector';
import { MockedApi } from './utils/mockedApi';

const fruit = [
  { name: 'Boysenberry', id: 'boysenberry', labTestCategoryId: 'Sweet' },
  { name: 'Grape', id: 'grape', labTestCategoryId: 'Sweet' },
  { name: 'Lemon', id: 'lemon', labTestCategoryId: 'Sweet' },
  { name: 'Strawberry', id: 'strawb', labTestCategoryId: 'Sweet' },
];

const vegetables = [
  { name: 'Cabbage', id: 'cabbage', labTestCategoryId: 'Savoury' },
  { name: 'Chilli', id: 'chilli', labTestCategoryId: 'Savoury' },
  { name: 'Fennel', id: 'fennel', labTestCategoryId: 'Savoury' },
  { name: 'Leek', id: 'leek', labTestCategoryId: 'Savoury' },
  { name: 'Pepper', id: 'pepper', labTestCategoryId: 'Savoury' },
  { name: 'Sprout', id: 'sprout', labTestCategoryId: 'Savoury' },
  { name: 'Zucchini', id: 'zuc', labTestCategoryId: 'Savoury' },
];

const testTypes = [
  { name: 'Chicken', id: 'chicken', labTestCategoryId: 'Savoury' },
  { name: 'Chocolate', id: 'chocolate', labTestCategoryId: 'Sweet' },
  { name: 'Egg', id: 'egg', labTestCategoryId: 'Savoury' },
  { name: 'Vanilla', id: 'vanilla', labTestCategoryId: 'Sweet' },
  { name: 'Yeast', id: 'yeast', labTestCategoryId: 'Savoury' },
  ...vegetables,
  ...fruit,
];

export default {
  title: 'Forms/TestSelector',
  component: TestSelectorInput,
  argTypes: {
    selectMethod: {
      control: 'select',
      options: Object.values(LAB_REQUEST_SELECT_LAB_METHOD),
    },
  },
};

const endpoints = {
  'suggestions/labTestPanel/all': () => [
    { id: 'fruit', name: 'Fruit' },
    { id: 'vegetables', name: 'Vegetables' },
  ],
  'suggestions/labTestCategory/:query': () => [
    { id: 'Savoury', name: 'Savoury' },
    { id: 'Sweet', name: 'Sweet' },
  ],
  'labTestPanel/:id/labTestTypes': (_, id) => {
    if (id === 'fruit') return fruit;
    if (id === 'vegetables') return vegetables;
    return [];
  },
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

export const Individual = Template.bind({});
Individual.args = {
  selectMethod: LAB_REQUEST_SELECT_LAB_METHOD.INDIVIDUAL,
};

export const Panel = Template.bind({});
Panel.args = {
  selectMethod: LAB_REQUEST_SELECT_LAB_METHOD.PANEL,
};
