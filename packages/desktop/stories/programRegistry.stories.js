import React from 'react';
import { storiesOf } from '@storybook/react';
import { DisplayPatientRegDetails } from '../app/views/programRegistry/DisplayPatientRegDetails';
import { MockedApi } from './utils/mockedApi';

const mockedProgramRegistryPatientDetailsEndPoint = {
  '/programRegistry/patient/:id': () => ({
    dateOfRegistration: '2023-08-31 01:32:02.49+00',
    registeredBy: 'Alice',
    registrationStatus: 'Active',
    clinicalStatus: 'Low risk',
  }),
};
storiesOf('Program Registry', module).add('DisplayPatientRegDetails', () => (
  <MockedApi endpoints={{ mockedProgramRegistryPatientDetailsEndPoint }}>
    <DisplayPatientRegDetails />
  </MockedApi>
));
