import React from 'react';
import { storiesOf } from '@storybook/react';
import { ENCOUNTER_TYPES } from 'shared/constants';
import { createDummyPatient } from 'shared/demoData';
import { PatientEncounterSummary } from '../app/views/patients/components/PatientEncounterSummary';

const patient = createDummyPatient();
const { currentEncounter } = patient;

storiesOf('PatientEncounterSummary', module)
  .add('No current visit', () => <PatientEncounterSummary encounter={null} patient={patient} />)
  .add(ENCOUNTER_TYPES.ADMISSION, () => (
    <PatientEncounterSummary
      encounter={{ ...currentEncounter, encounterType: ENCOUNTER_TYPES.ADMISSION }}
      patient={patient}
    />
  ))
  .add(ENCOUNTER_TYPES.CLINIC, () => (
    <PatientEncounterSummary
      encounter={{ ...currentEncounter, encounterType: ENCOUNTER_TYPES.CLINIC }}
      patient={patient}
    />
  ))
  .add(ENCOUNTER_TYPES.IMAGING, () => (
    <PatientEncounterSummary
      encounter={{ ...currentEncounter, encounterType: ENCOUNTER_TYPES.IMAGING }}
      patient={patient}
    />
  ))
  .add(ENCOUNTER_TYPES.EMERGENCY, () => (
    <PatientEncounterSummary
      encounter={{ ...currentEncounter, encounterType: ENCOUNTER_TYPES.EMERGENCY }}
      patient={patient}
    />
  ))
  .add(ENCOUNTER_TYPES.TRIAGE, () => (
    <PatientEncounterSummary
      encounter={{ ...currentEncounter, encounterType: ENCOUNTER_TYPES.TRIAGE }}
      patient={patient}
    />
  ))
  .add('Deceased', () => (
    <PatientEncounterSummary encounter={null} patient={{ ...patient, dateOfDeath: '123' }} />
  ));
