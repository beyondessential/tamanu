import React from 'react';
import styled from 'styled-components';

import { PatientInfoPane } from '../app/components/PatientInfoPane';
import { MockedApi } from './utils/mockedApi';

const endpoints = {
  'patient/:id/conditions': () => {
    return {
      data: [{ condition: { name: 'Condition 1' } }, { condition: { name: 'Condition 2' } }],
    };
  },
  'patient/:id/allergies': () => {
    return {
      data: [{ allergy: { name: 'Allergy 1' } }, { allergy: { name: 'Allergy 2' } }],
    };
  },
  'patient/:id/familyHistory': () => {
    return {
      data: [{ relationship: 'Brother', diagnosis: { name: 'Diagnosis 1' } }],
    };
  },
  'patient/:id/issues': () => {
    return {
      data: [{ note: 'Issue 1' }, { note: 'Issue 2' }],
    };
  },
  'patient/:id/carePlans': () => {
    return {
      data: [{ carePlan: { name: 'Care Plan 1' } }, { carePlan: { name: 'Care Plan 2' } }],
    };
  },
};

const Container = styled.div`
  width: 330px;
`;

const MockedApiDecorator = Story => (
  <Container>
    <MockedApi endpoints={endpoints}>
      <Story />
    </MockedApi>
  </Container>
);

export default {
  title: 'PatientInfoPane',
  component: PatientInfoPane,
  decorators: [MockedApiDecorator],
};

export const BasicExample = {
  render: () => <PatientInfoPane />,
};
