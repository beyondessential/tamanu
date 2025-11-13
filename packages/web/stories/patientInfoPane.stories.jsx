import React from 'react';
import { storiesOf } from '@storybook/react';
import styled from 'styled-components';

import { PatientInfoPane } from '../app/components/PatientInfoPane';
import { MockedApi } from './utils/mockedApi';
import { MockSettingsProvider } from './utils/mockSettingsProvider';

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

storiesOf('PatientInfoPane', module)
  .addDecorator(story => (
    <Container>
      <MockSettingsProvider mockSettings={{}}>
        <MockedApi endpoints={endpoints}>{story()}</MockedApi>
      </MockSettingsProvider>
    </Container>
  ))
  .add('Basic Example', () => <PatientInfoPane />);
