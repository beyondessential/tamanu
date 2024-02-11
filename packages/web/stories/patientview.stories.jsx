import React from 'react';
import { storiesOf } from '@storybook/react';
import { ENCOUNTER_TYPES } from '@tamanu/constants';
import { createDummyPatient } from '@tamanu/shared/demoData';
import { PatientEncounterSummary } from '../app/views/patients/components/PatientEncounterSummary';
import { MockedApi } from './utils/mockedApi';
import { getCurrentDateString, getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';

const patient = createDummyPatient(null, { id: 'test-patient' });

const getEndpointsForEncounterType = encounterType => ({
  'patient/:id/currentEncounter': () => {
    return {
      encounterType,
      id: 'current-encounter',
      examiner: {
        displayName: 'Dr. John',
      },
      location: {
        name: 'Location 1',
      },
      referralSource: {
        name: 'Other clinic',
      },
      reasonForEncounter: 'Unwell',
      startDate: getCurrentDateTimeString(),
    };
  },
});

storiesOf('PatientEncounterSummary', module)
  .addDecorator(Story => (
    <MockedApi
      endpoints={{
        'patient/:id/currentEncounter': () => null,
        'patient/test-patient/death': () => ({
          facility: {
            name: 'Facility 1',
          },
          clinician: {
            displayName: 'Dr. John',
          },
          dateOfDeath: getCurrentDateString(),
          causes: {
            primary: {
              condition: {
                name: 'Condition 1',
              },
            },
          },
        }),
      }}
    >
      {Story()}
    </MockedApi>
  ))
  .add('No current visit', () => <PatientEncounterSummary patient={patient} />)
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
    <PatientEncounterSummary encounter={null} patient={{ ...patient, dateOfDeath: '123' }} />
  ));
