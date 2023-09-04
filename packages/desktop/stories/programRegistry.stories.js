import React from 'react';
import { storiesOf } from '@storybook/react';
import { DisplayPatientRegDetails } from '../app/views/programRegistry/DisplayPatientRegDetails';

storiesOf('Program Registry', module).add('DisplayPatientRegDetails Active', () => (
  <DisplayPatientRegDetails
    patientProgramRegistration={{
      date: '2023-08-28T02:40:16.237Z',
      programRegistryClinicalStatusId: 'Low risk',
      addedBy: 'Alaister',
      removedBy: 'Alaister',
      registrationStatus: 'Active',
    }}
  />
));

storiesOf('Program Registry', module).add('DisplayPatientRegDetails Removed', () => (
  <DisplayPatientRegDetails
    patientProgramRegistration={{
      date: '2023-08-28T02:40:16.237Z',
      programRegistryClinicalStatusId: 'Low risk',
      addedBy: 'Alaister',
      removedBy: 'Alaister',
      registrationStatus: 'Removed',
    }}
  />
));
