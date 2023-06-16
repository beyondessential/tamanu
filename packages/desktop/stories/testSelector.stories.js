import { action } from '@storybook/addon-actions';
import React from 'react';
import { LAB_REQUEST_FORM_TYPES } from '@tamanu/shared/constants/labs';
import { TestSelectorInput } from '../app/views/labRequest/TestSelector';
import { MockedApi } from './utils/mockedApi';
import { mockLabTestTypes, mockTestSelectorEndpoints } from './utils/mockLabData';

export default {
  argTypes: {
    requestFormType: {
      options: Object.values(LAB_REQUEST_FORM_TYPES),
    },
  },
  title: 'Forms/TestSelector',
  component: TestSelectorInput,
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
          {...args}
          testTypes={mockLabTestTypes}
          value={selected}
          onChange={onChange}
        />
      </div>
    </MockedApi>
  );
};

export const Individual = Template.bind({});
Individual.args = {
  requestFormType: LAB_REQUEST_FORM_TYPES.INDIVIDUAL,
};

export const Panel = Template.bind({});
Panel.args = {
  requestFormType: LAB_REQUEST_FORM_TYPES.PANEL,
};
