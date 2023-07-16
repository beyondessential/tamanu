import React from 'react';
import { action } from '@storybook/addon-actions';
import { defaultEndpoints, fakeLabRequest } from '../.storybook/__mocks__/defaultEndpoints';
import { LabTestResultsModal } from '../app/components/LabRequestModals/LabTestResultsModal';
import { MockedApi } from './utils/mockedApi';

export default {
  argType: {
    labRequest: { control: { disable: true } },
  },
  title: 'Modal/LabTestResultsModal',
  component: LabTestResultsModal,
};

const Template = args => (
  <MockedApi
    endpoints={{
      ...defaultEndpoints,
      'labTestType/:labRequestId/tests': () => {
        return [
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
        ];
      },
    }}
  >
    <LabTestResultsModal {...args} open onClose={action('close')} />
  </MockedApi>
);

export const Default = Template.bind({});
Default.args = {
  labRequest: fakeLabRequest(),
};
