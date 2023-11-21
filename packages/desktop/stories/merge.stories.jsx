import React, { useState } from 'react';

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { MockedApi } from './utils/mockedApi';

import { 
  PatientMergeView,
  PatientMergeSearch,
  KeepPatientDecisionForm,
  PatientSummary,
  ConfirmationModal,
  MergeResultModal,
  MergeErrorModal,
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

storiesOf('Admin/PatientMerge', module)
  .addDecorator(Story => <MockedApi endpoints={endpoints}><Story /></MockedApi>)
  .add('Patient search', () => (
    <PatientMergeSearch 
      onBeginMerge={action('beginMerge')}
    />
  ))
  .add('Patient search with error', () => (
    <MockedApi endpoints={{ 
      'admin/lookup/patient/:id': () => { throw new Error('Not found') }
    }} >
      <PatientMergeSearch 
        onBeginMerge={action('beginMerge')}
      />
    </MockedApi>
  ))
  .add('Patient summary', () => {
    const [selected, setSelected] = useState(false);
    return (
      <PatientSummary
        patient={firstPatient}
        onSelect={() => setSelected(!selected)}
        selected={selected}
      />
    );
  })
  .add('Decision form', () => (
    <KeepPatientDecisionForm
      firstPatient={firstPatient}
      secondPatient={secondPatient}
      onCancel={action('cancel')}
      onSelectPlan={action('selectPlan')}
    />
  ))
  .add('Confirmation form', () => (
    <ConfirmationModal
      mergePlan={{
        keepPatient: firstPatient,
        removePatient: secondPatient,
      }}
      onCancel={action('cancel')}
      onConfirm={action('confirm')}
    />
  ))
  .add('Result modal', () => (
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
  ))
  .add('Error modal', () => (
    <MergeErrorModal
      error={new Error("A test error occurred.")}
      onClose={action('close')}
    />
  ))
  .add('Entire flow', () => (
    <PatientMergeView
      onMergePatients={action('merge')}
    />
  ));
