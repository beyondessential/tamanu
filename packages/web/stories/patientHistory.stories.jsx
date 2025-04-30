import React from 'react';
import styled from 'styled-components';

import { createDummyPatient, createDummyPatientAdditionalData } from '@tamanu/database/demoData';
import { fakeEncounter } from '../.storybook/__mocks__/defaultEndpoints.js';

import { PatientHistory } from '../app/components/PatientHistory';
import { MockedApi } from './utils/mockedApi';

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
    locationGroupName: 'Outpatients Department - Wing 1',
    reasonForEncounter: 'Routine tests for a visa, plus a sore eye',
  },
  {
    ...fakeEncounter(),
    facilityName: 'Colonial War Memorial Division Hospital',
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

export default {
  title: 'PatientHistory',
  component: PatientHistory,
  decorators: [
    (Story) => (
      <Container>
        <MockedApi endpoints={endpoints}>{Story()}</MockedApi>
      </Container>
    ),
  ],
};

export const BasicExample = {
  render: () => <PatientHistory patient={patient} onItemClick={console.log} />,
};
