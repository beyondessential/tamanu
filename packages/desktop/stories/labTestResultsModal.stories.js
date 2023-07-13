import React from 'react';
import { fakeLabRequest } from '../.storybook/__mocks__/defaultEndpoints';
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
      'labTestType/:labRequestId/tests': () => {
        return [
          {
            testType: {
              name: 'HGB',
              unit: 'g/dL',
            },
          },
          {
            testType: {
              name: 'PLT',
              unit: 'x10^3/uL',
            },
          },
        ];
      },
    }}
  >
    <LabTestResultsModal {...args} open />;
  </MockedApi>
);

export const Default = Template.bind({});
Default.args = {
  labRequest: fakeLabRequest(),
};
