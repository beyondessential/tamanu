import React, { useState } from 'react';

import { action } from 'storybook/actions';
import { MockedApi } from './utils/mockedApi';

import {
  ConfirmationModal,
  KeepPatientDecisionForm,
  MergeErrorModal,
  MergeResultModal,
  PatientMergeSearch,
  PatientMergeView,
  PatientSummary as PatientSummaryComponent,
} from '../app/views/administration/patientMerge';

const baseDetails = {
  firstName: 'Ugyen',
  lastName: 'Wangdi',
  culturalName: 'Ugyen',
  village: { name: 'Narokoyama' },
  sex: 'female',
  dateOfBirth: new Date(),
};
const firstPatient = {
  ...baseDetails,
  id: '000001',
  displayId: 'TEMP001',
};
const secondPatient = {
  ...baseDetails,
  id: '000002',
  displayId: 'TEMP002',
};

const fakeGetPatient = displayId => ({
  ...baseDetails,
  displayId: displayId.toUpperCase(),
  id: (Math.random() * 10000.0).toFixed(0),
});

const endpoints = {
  'admin/lookup/patient/:id': (data, id) => {
    return fakeGetPatient(id);
  },
  'admin/mergePatient': data => {
    action('call admin/mergePatient')(data);
    return {
      updates: {
        Patient: 1,
        PatientEncounter: (1 + Math.random() * 3).toFixed(0),
        PatientAllergy: (1 + Math.random() * 3).toFixed(0),
        PatientCarePlan: (1 + Math.random() * 3).toFixed(0),
        PatientIssue: (1 + Math.random() * 3).toFixed(0),
      },
    };
  },
};

export default {
  title: 'Admin/PatientMerge',
  decorators: [
    Story => (
      <MockedApi endpoints={endpoints}>
        <Story />
      </MockedApi>
    ),
  ],
};

export const PatientSearch = () => <PatientMergeSearch onBeginMerge={action('beginMerge')} />;

PatientSearch.story = {
  name: 'Patient search',
};

export const PatientSearchWithError = () => (
  <MockedApi
    endpoints={{
      'admin/lookup/patient/:id': () => {
        throw new Error('Not found');
      },
    }}
  >
    <PatientMergeSearch onBeginMerge={action('beginMerge')} />
  </MockedApi>
);

PatientSearchWithError.story = {
  name: 'Patient search with error',
};

export const PatientSummary = () => {
  const [selected, setSelected] = useState(false);
  return (
    <PatientSummaryComponent
      patient={firstPatient}
      onSelect={() => setSelected(!selected)}
      selected={selected}
    />
  );
};

PatientSummary.story = {
  name: 'Patient summary',
};

export const DecisionForm = () => (
  <KeepPatientDecisionForm
    firstPatient={firstPatient}
    secondPatient={secondPatient}
    onCancel={action('cancel')}
    onSelectPlan={action('selectPlan')}
  />
);

DecisionForm.story = {
  name: 'Decision form',
};

export const ConfirmationForm = () => (
  <ConfirmationModal
    mergePlan={{
      keepPatient: firstPatient,
      removePatient: secondPatient,
    }}
    onCancel={action('cancel')}
    onConfirm={action('confirm')}
  />
);

ConfirmationForm.story = {
  name: 'Confirmation form',
};

export const ResultModal = () => (
  <MergeResultModal
    result={{
      updates: {
        Patient: 1,
        PatientEncounter: 3,
        PatientAdditionalData: 1,
        PatientIssue: 3,
      },
    }}
    onClose={action('close')}
  />
);

ResultModal.story = {
  name: 'Result modal',
};

export const ErrorModal = () => (
  <MergeErrorModal error={new Error('A test error occurred.')} onClose={action('close')} />
);

ErrorModal.story = {
  name: 'Error modal',
};

export const EntireFlow = () => <PatientMergeView onMergePatients={action('merge')} />;

EntireFlow.story = {
  name: 'Entire flow',
};
