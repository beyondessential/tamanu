import { action } from '@storybook/addon-actions';
import React from 'react';
import { LAB_REQUEST_SELECT_LAB_METHOD } from 'shared/constants/labs';
import { TestSelectorInput } from '../app/views/labRequest/TestSelector';
import { MockedApi } from './utils/mockedApi';
import { mockLabTestTypes, mockTestSelectorEndpoints } from './utils/mockLabData';

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
