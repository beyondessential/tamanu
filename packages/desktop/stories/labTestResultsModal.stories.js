import React from 'react';
import { action } from '@storybook/addon-actions';
import { defaultEndpoints, fakeLabRequest } from '../.storybook/__mocks__/defaultEndpoints';
import { MockedApi } from './utils/mockedApi';
import { LabTestResultsModal } from '../app/views/patients/components/LabTestResultsModal';

export default {
  argType: {
    labRequest: { control: { disable: true } },
  },
  title: 'Modal/LabTestResultsModal',
  component: LabTestResultsModal,
};

const mockLabTests = {
  data: [
    {
      id: 1,
      labTestType: {
        name: 'HGB',
        unit: 'g/dL',
      },
    },
    {
      id: 2,
      labTestType: {
        name: 'PLT',
        unit: 'x10^3/uL',
      },
    },
    {
      id: 3,
      labTestType: {
        name: 'MCH',
        unit: 'pg',
      },
    },
    {
      id: 4,
      labTestType: {
        name: 'MCHC',
        unit: 'g/dL',
      },
    },
  ],
  count: 4,
};

const Template = args => (
  <MockedApi
    endpoints={{
      ...defaultEndpoints,
      'labRequest/:labRequestId/tests': () => mockLabTests,
    }}
  >
    <LabTestResultsModal {...args} open onClose={action('close')} />
  </MockedApi>
);

export const Default = Template.bind({});
Default.args = {
  labRequest: fakeLabRequest(),
};
