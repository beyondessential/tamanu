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
    patientId: chance.hash({ length: 10 }),
    testId: chance.hash({ length: 8 }),
    patientAge: chance.age(),
    date: chance.date({ string: true }),
    labCategory: chance.pickone(['Microbiology', 'Malaria', 'Serology', 'Covid']),
  };
};

const Template = args => <LabRequestPrintLabel {...args} />;

export const LabRequest = Template.bind({});
LabRequest.args = mockData();
