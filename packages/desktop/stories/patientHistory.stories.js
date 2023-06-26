import React from 'react';
import { storiesOf } from '@storybook/react';
import styled from 'styled-components';

import {
  createDummyPatient,
  createDummyPatientAdditionalData,
  createDummyEncounter,
} from '@tamanu/shared/demoData';
import { fakeEncounter } from '@tamanu/shared/test-helpers';

import { PatientHistory } from '../app/components/PatientHistory';
import { MockedApi } from './utils/mockedApi';

const dummyPatient = createDummyPatient();
const dummyAdditionalData = createDummyPatientAdditionalData();
const dummyEncounter = fakeEncounter();

const patient = {
  ...dummyPatient,
  ...dummyAdditionalData,
  markedForSync: true,
};

const encounter = {
  ...dummyEncounter,
  locationGroupName: 'Central hospital waiting room',
  reasonForEncounter:
    'Point 3: I think youre right in a way... and the clever solution would be to have a tree structure so that its moving forward for a clinic to go to an admission, however to be honest I think this is the cleanest most minimal change at the moment, and to be honest its probably also easier to understand (at least for me). We can think of encounter progression maybe as something like ED encounter progression, if that makes more sense to you we can change the naming?',
  reasonForEncounter1:
    'Point 3: I think youre right in a way... and the clever solution would be to have a tree structure so that its moving forward for a clinic to go to an admission, however to be honest I think this is the cleanest most minimal change at the moment, and to be honest its probably also easier to understand (at least for me). We can think of encounter progression maybe as something like ED encounter progression, if that makes more sense to you we can change the naming?',
};

const endpoints = {
  'patient/:id/encounters': () => {
    return {
      data: [encounter],
    };
  },
};

const Container = styled.div`
  width: 100%;
`;

storiesOf('PatientHistory', module)
  .addDecorator(story => (
    <Container>
      <MockedApi endpoints={endpoints}>{story()}</MockedApi>
    </Container>
  ))
  .add('Basic Example', () => <PatientHistory patient={patient} onItemClick={console.log} />);

// Add Dipstick and Machine
