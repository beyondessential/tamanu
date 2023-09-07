import React from 'react';
import { storiesOf } from '@storybook/react';
import { DisplayPatientRegDetails } from '../app/views/programRegistry/DisplayPatientRegDetails';

storiesOf('Program Registry', module).add('DisplayPatientRegDetails Low risk', () => (
  <div style={{ width: '797px' }}>
    <DisplayPatientRegDetails
      patientProgramRegistration={{
        date: '2023-08-28T02:40:16.237Z',
        programRegistryClinicalStatusId: '123123',
        programRegistryClinicalStatus: {
          id: '123123',
          code: 'low_risk',
          name: 'Low risk',
          color: 'green',
        },
        clinicianId: '213123',
        clinician: {
          id: '213123',
          displayName: 'Alaister',
        },
        registrationStatus: 'active',
      }}
    />
  </div>
));

storiesOf('Program Registry', module).add('DisplayPatientRegDetails Critical', () => (
  <div style={{ width: '797px' }}>
    <DisplayPatientRegDetails
      patientProgramRegistration={{
        date: '2023-08-28T02:40:16.237Z',
        programRegistryClinicalStatusId: '123123',
        programRegistryClinicalStatus: {
          id: '123123',
          code: 'critical',
          name: 'Critical',
          color: 'red',
        },
        clinicianId: '213123',
        clinician: {
          id: '213123',
          displayName: 'Alaister',
        },
        removedById: '213123',
        removedBy: {
          id: '213123',
          displayName: 'Alaister',
        },
        registrationStatus: 'removed',
      }}
    />
  </div>
));

storiesOf('Program Registry', module).add('DisplayPatientRegDetails Needs review', () => (
  <div style={{ width: '797px' }}>
    <DisplayPatientRegDetails
      patientProgramRegistration={{
        date: '2023-08-28T02:40:16.237Z',
        programRegistryClinicalStatusId: '123123',
        programRegistryClinicalStatus: {
          id: '123123',
          code: 'needs_review',
          name: 'Needs review',
          color: 'yellow',
        },
        clinicianId: '213123',
        clinician: {
          id: '213123',
          displayName: 'Alaister',
        },
        removedById: '213123',
        removedBy: {
          id: '213123',
          displayName: 'Alaister',
        },
        registrationStatus: 'removed',
      }}
    />
  </div>
));
