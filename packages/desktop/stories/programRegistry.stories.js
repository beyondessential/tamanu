import React from 'react';
import { storiesOf } from '@storybook/react';
import { DisplayPatientRegDetails } from '../app/views/programRegistry/DisplayPatientRegDetails';

storiesOf('Program Registry', module).add('DisplayPatientRegDetails Active', () => (
  <div style={{ width: '797px' }}>
    <DisplayPatientRegDetails
      patientProgramRegistration={{
        date: '2023-08-28T02:40:16.237Z',
        programRegistryClinicalStatusId: 'Low risk',
        addedById: '213123',
        addedBy: {
          id: '213123',
          displayName: 'Alaister',
        },
        statusId: 'q234234234',
        status: {
          id: '123123',
          name: 'Active',
          code: 'active',
        },
      }}
    />
  </div>
));

storiesOf('Program Registry', module).add('DisplayPatientRegDetails Removed', () => (
  <div style={{ width: '797px' }}>
    <DisplayPatientRegDetails
      patientProgramRegistration={{
        date: '2023-08-28T02:40:16.237Z',
        programRegistryClinicalStatusId: 'Low risk',
        addedById: '213123',
        addedBy: {
          id: '213123',
          displayName: 'Alaister',
        },
        removedById: '213123',
        removedBy: {
          id: '213123',
          displayName: 'Alaister',
        },
        statusId: 'q234234234',
        status: {
          id: '123123',
          name: 'Removed',
          code: 'removed',
        },
      }}
    />
  </div>
));
