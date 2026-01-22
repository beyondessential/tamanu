import React from 'react';
import { storiesOf } from '@storybook/react';
import styled from 'styled-components';

import { createDummyPatient, createDummyPatientAdditionalData } from '@tamanu/database/demoData';
import { fakeEncounter } from '../.storybook/__mocks__/defaultEndpoints.js';

import { PatientHistory } from '../app/components/PatientHistory';
import { MockedApi } from './utils/mockedApi';
import { MockSettingsProvider } from './utils/mockSettingsProvider.jsx';

const dummyPatient = createDummyPatient();
const dummyAdditionalData = createDummyPatientAdditionalData();

const patient = {
  ...dummyPatient,
  ...dummyAdditionalData,
  markedForSync: true,
};

const encounters = [
  {
    ...fakeEncounter(),
    endDate: null,
    facilityName: 'Colonial War Memorial Division Hospital',
    dischargingClinicianName: 'Dr. John Doe',
    locationGroupName: 'Outpatients Department - Wing 1',
    reasonForEncounter: 'Routine tests for a visa, plus a sore eye',
  },
  {
    ...fakeEncounter(),
    facilityName: 'Colonial War Memorial Division Hospital',
    dischargingClinicianName: 'Dr. Jane Doe',
    locationGroupName: 'ACU',
    reasonForEncounter:
      'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Nihil, totam. This is roman text for a second time: Lorem ipsum dolor sit amet, consectetur adipisicing elit. Nihil, totam.',
  },
];

const endpoints = {
  'patient/:id/encounters': () => {
    return {
      data: encounters,
    };
  },
};

const Container = styled.div`
  width: 100%;
`;

storiesOf('PatientHistory', module)
  .addDecorator(story => (
    <Container>
      <MockSettingsProvider mockSettings={{}}>
        <MockedApi endpoints={endpoints}>{story()}</MockedApi>
      </MockSettingsProvider>
    </Container>
  ))
  .add('Basic Example', () => <PatientHistory patient={patient} onItemClick={console.log} />);
