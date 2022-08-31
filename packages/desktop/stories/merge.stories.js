import React, { useState } from 'react';

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import { 
  PatientMergeView,
  PatientMergeSearch,
  KeepPatientDecisionForm,
  PatientSummary,
  ConfirmationModal,
} from '../app/views/administration/patientMerge';

const baseDetails = {
  id: '123123123',
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

storiesOf('Admin/PatientMerge', module)
  .add('Patient search', () => (
    <PatientMergeSearch 
      fetchPatient={fakeGetPatient}
      onBeginMerge={action('beginMerge')}
    />
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
      onSelectPatient={action('confirm')}
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
  .add('Entire flow', () => (
    <PatientMergeView
      fetchPatient={fakeGetPatient}
      onMergePatients={action('merge')}
    />
  ));
