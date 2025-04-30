import React, { useState } from 'react';
import { action } from '@storybook/addon-actions';
import { MockedApi } from './utils/mockedApi';

import { 
  ConfirmationModal,
  KeepPatientDecisionForm,
  MergeErrorModal,
  MergeResultModal,
  PatientMergeSearch,
  PatientMergeView,
  PatientSummary,
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
}

const fakeGetPatient = displayId => ({
  ...baseDetails,
  displayId: displayId.toUpperCase(),
  id: (Math.random() * 10000.0).toFixed(0),
});

const endpoints = {
  'admin/lookup/patient/:id': (data, id) => {
    return fakeGetPatient(id);
  },
  'admin/mergePatient': (data) => {
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
  }
};

const PatientSummaryWithState = () => {
  const [selected, setSelected] = useState(false);
  return (
    <PatientSummary
      patient={firstPatient}
      onSelect={() => setSelected(!selected)}
      selected={selected}
    />
  );
};

export default {
  title: 'Admin/PatientMerge',
  decorators: [(Story) => <MockedApi endpoints={endpoints}><Story /></MockedApi>],
};

export const PatientSearch = {
  render: () => (
    <PatientMergeSearch 
      onBeginMerge={action('beginMerge')}
    />
  ),
};

export const PatientSearchWithError = {
  render: () => (
    <MockedApi endpoints={{ 
      'admin/lookup/patient/:id': () => { throw new Error('Not found') }
    }} >
      <PatientMergeSearch 
        onBeginMerge={action('beginMerge')}
      />
    </MockedApi>
  ),
};

export const PatientSummaryStory = {
  render: () => <PatientSummaryWithState />,
};

export const DecisionForm = {
  render: () => (
    <KeepPatientDecisionForm
      firstPatient={firstPatient}
      secondPatient={secondPatient}
      onCancel={action('cancel')}
      onSelectPlan={action('selectPlan')}
    />
  ),
};

export const ConfirmationForm = {
  render: () => (
    <ConfirmationModal
      mergePlan={{
        keepPatient: firstPatient,
        removePatient: secondPatient,
      }}
      onCancel={action('cancel')}
      onConfirm={action('confirm')}
    />
  ),
};

export const ResultModal = {
  render: () => (
    <MergeResultModal
      result={{
        updates: {
          Patient: 1,
          PatientEncounter: 3,
          PatientAdditionalData: 1,
          PatientIssue: 3,
        }
      }}
      onClose={action('close')}
    />
  ),
};

export const ErrorModal = {
  render: () => (
    <MergeErrorModal
      error={new Error("A test error occurred.")}
      onClose={action('close')}
    />
  ),
};

export const EntireFlow = {
  render: () => (
    <PatientMergeView
      onMergePatients={action('merge')}
    />
  ),
};
