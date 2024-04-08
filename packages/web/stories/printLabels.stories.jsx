import React from 'react';
import Chance from 'chance';
import { LabRequestPrintLabel } from '../app/components/PatientPrinting/printouts/LabRequestPrintLabel';

export default {
  title: 'PrintLabels',
  component: LabRequestPrintLabel,
};

const chance = new Chance();

const mockData = () => {
  return {
    patientName: chance.name(),
    patientId: chance.hash({ length: 10 }),
    testId: chance.hash({ length: 8 }),
    patientDateOfBirth: chance.birthday({ type: 'child' }),
    date: chance.date({ string: true }),
    labCategory: chance.pickone(['Microbiology', 'Malaria', 'Serology', 'Covid']),
  };
};

const Template = args => <LabRequestPrintLabel {...args} />;

export const LabRequest = Template.bind({});
LabRequest.args = {
  data: mockData(),
};
