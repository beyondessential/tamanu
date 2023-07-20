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

const mockLabTests = [
  {
    id: 1,
    testType: {
      name: 'HGB',
      unit: 'g/dL',
    },
  },
  {
    id: 2,
    testType: {
      name: 'PLT',
      unit: 'x10^3/uL',
    },
  },
  {
    id: 3,
    testType: {
      name: 'MCH',
      unit: 'pg',
    },
  },
  {
    id: 4,
    testType: {
      name: 'MCHC',
      unit: 'g/dL',
    },
  },
];

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
