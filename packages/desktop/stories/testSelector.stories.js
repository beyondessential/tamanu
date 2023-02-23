import { action } from '@storybook/addon-actions';
import React from 'react';
import { LAB_REQUEST_SELECT_LAB_METHOD } from 'shared/constants/labs';
import { TestSelectorInput } from '../app/components/LabRequest/TestSelector';
import { MockedApi } from './utils/mockedApi';

const fruit = [
  { name: 'Apple', id: 'apple', labTestCategoryId: 'Sweet' },
  { name: 'Banana', id: 'banana', labTestCategoryId: 'Sweet' },
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

const meat = [
  { name: 'Beef', id: 'beef', labTestCategoryId: 'Savoury' },
  { name: 'Chicken Breast', id: 'chicken_breast', labTestCategoryId: 'Savoury' },
  { name: 'Pork', id: 'pork', labTestCategoryId: 'Savoury' },
  { name: 'Salmon', id: 'salmon', labTestCategoryId: 'Savoury' },
  { name: 'Tuna', id: 'tuna', labTestCategoryId: 'Savoury' },
];

const baking = [
  { name: 'Chocolate', id: 'chocolate', labTestCategoryId: 'Sweet' },
  { name: 'Egg', id: 'egg', labTestCategoryId: 'Savoury' },
  { name: 'Vanilla', id: 'vanilla', labTestCategoryId: 'Sweet' },
  { name: 'Yeast', id: 'yeast', labTestCategoryId: 'Savoury' },
  { name: 'Baking Powder', id: 'bakingpowder', labTestCategoryId: 'Savoury' },
];

export const mockLabTestTypes = [...baking, ...meat, ...vegetables, ...fruit];

const panelIdToTestTypes = {
  baking,
  meat,
  vegetables,
  fruit,
};

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

export const mockTestSelectorEndpoints = {
  'suggestions/labTestPanel/all': () => [
    { id: 'fruit', name: 'Fruit' },
    { id: 'vegetables', name: 'Vegetables' },
    { id: 'meat', name: 'Meat' },
    { id: 'baking', name: 'Baking' },
  ],
  'suggestions/labTestCategory/:query': () => [
    { id: 'Savoury', name: 'Savoury' },
    { id: 'Sweet', name: 'Sweet' },
  ],
  'labTestPanel/:id/labTestTypes': (_, id) => {
    return panelIdToTestTypes[id] || [];
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
    <MockedApi endpoints={mockTestSelectorEndpoints}>
      <div style={{ width: 800, height: 500 }}>
        <TestSelectorInput
          testTypes={mockLabTestTypes}
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
