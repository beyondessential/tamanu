import React from 'react';
import { ENCOUNTER_TYPES } from '@tamanu/constants';
import { createDummyPatient } from '@tamanu/database/demoData';
import { PatientEncounterSummary } from '../app/views/patients/components/PatientEncounterSummary';
import { MockedApi } from './utils/mockedApi';
import { getCurrentDateString, getCurrentDateTimeString } from '@tamanu/utils/dateTime';

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

export default {
  title: 'PatientEncounterSummary',
  component: PatientEncounterSummary,
  decorators: [
    (Story) => (
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
    ),
  ],
};

export const NoCurrentVisit = {
  render: () => <PatientEncounterSummary patient={patient} />,
};

export const Admission = {
  render: () => (
    <MockedApi endpoints={getEndpointsForEncounterType(ENCOUNTER_TYPES.ADMISSION)}>
      <PatientEncounterSummary patient={patient} />
    </MockedApi>
  ),
};

export const Clinic = {
  render: () => (
    <MockedApi endpoints={getEndpointsForEncounterType(ENCOUNTER_TYPES.CLINIC)}>
      <PatientEncounterSummary patient={patient} />
    </MockedApi>
  ),
};

export const Imaging = {
  render: () => (
    <MockedApi endpoints={getEndpointsForEncounterType(ENCOUNTER_TYPES.IMAGING)}>
      <PatientEncounterSummary patient={patient} />
    </MockedApi>
  ),
};

export const Emergency = {
  render: () => (
    <MockedApi endpoints={getEndpointsForEncounterType(ENCOUNTER_TYPES.EMERGENCY)}>
      <PatientEncounterSummary patient={patient} />
    </MockedApi>
  ),
};

export const Triage = {
  render: () => (
    <MockedApi endpoints={getEndpointsForEncounterType(ENCOUNTER_TYPES.TRIAGE)}>
      <PatientEncounterSummary patient={patient} />
    </MockedApi>
  ),
};

export const Deceased = {
  render: () => (
    <PatientEncounterSummary encounter={null} patient={{ ...patient, dateOfDeath: '123' }} />
  ),
};
