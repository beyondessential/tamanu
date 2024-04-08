import { action } from '@storybook/addon-actions';
import React from 'react';
import { LAB_REQUEST_FORM_TYPES } from '@tamanu/constants/labs';
import { Box } from '@material-ui/core';
import { TestSelectorInput } from '../app/views/labRequest/TestSelector';
import { MockedApi } from './utils/mockedApi';
import { mockTestSelectorEndpoints } from './utils/mockLabData';
import { FORM_TYPE_TO_FIELD_CONFIG } from '../app/forms/LabRequestForm/LabRequestFormScreen2';

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
  const { requestFormType } = args;
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
      <Box width={800} height={500}>
        <TestSelectorInput
          {...args}
          labelConfig={FORM_TYPE_TO_FIELD_CONFIG[requestFormType]}
          value={selected}
          onChange={onChange}
        />
      </Box>
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
