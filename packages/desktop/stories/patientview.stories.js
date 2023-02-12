import React from 'react';
import { storiesOf } from '@storybook/react';
import { ENCOUNTER_TYPES } from 'shared/constants';
import { createDummyPatient } from 'shared/demoData';
import { PatientEncounterSummary } from '../app/views/patients/components/PatientEncounterSummary';
import { MockedApi } from './utils/mockedApi';

const patient = createDummyPatient();
const { currentEncounter } = patient;

const getEndpointsForEncounterType = encounterType => ({
  'patient/:id/currentEncounter': async () => {
    return { ...currentEncounter, encounterType };
  },
});

storiesOf('PatientEncounterSummary', module)
  .add('No current visit', () => (
    <MockedApi
      endpoints={{
        'patient/:id/currentEncounter': async () => {
          return null;
        },
      }}
    >
      <PatientEncounterSummary patient={patient} />
    </MockedApi>
  ))
  .add(ENCOUNTER_TYPES.ADMISSION, () => (
    <MockedApi endpoints={getEndpointsForEncounterType(ENCOUNTER_TYPES.ADMISSION)}>
      <PatientEncounterSummary patient={patient} />
    </MockedApi>
  ))
  .add(ENCOUNTER_TYPES.CLINIC, () => (
    <MockedApi endpoints={getEndpointsForEncounterType(ENCOUNTER_TYPES.CLINIC)}>
      <PatientEncounterSummary patient={patient} />
    </MockedApi>
  ))
  .add(ENCOUNTER_TYPES.IMAGING, () => (
    <MockedApi endpoints={getEndpointsForEncounterType(ENCOUNTER_TYPES.IMAGING)}>
      <PatientEncounterSummary patient={patient} />
    </MockedApi>
  ))
  .add(ENCOUNTER_TYPES.EMERGENCY, () => (
    <MockedApi endpoints={getEndpointsForEncounterType(ENCOUNTER_TYPES.EMERGENCY)}>
      <PatientEncounterSummary patient={patient} />
    </MockedApi>
  ))
  .add(ENCOUNTER_TYPES.TRIAGE, () => (
    <MockedApi endpoints={getEndpointsForEncounterType(ENCOUNTER_TYPES.TRIAGE)}>
      <PatientEncounterSummary patient={patient} />
    </MockedApi>
  ))
  .add('Deceased', () => (
    <MockedApi
      endpoints={{
        'patient/:id/currentEncounter': async () => {
          return null;
        },
      }}
    >
      <PatientEncounterSummary encounter={null} patient={{ ...patient, dateOfDeath: '123' }} />
    </MockedApi>
  ));
