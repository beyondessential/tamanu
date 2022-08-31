import React from 'react';
import { ConfirmCancelRow } from '../../../components';
import { Modal } from '../../../components/Modal'

import { PatientSummary } from './PatientSummary';

import styled from 'styled-components';

const Red = styled.p`
    color: #f00;
`;

const ConfirmInstructions = () => (
  <div>
    <Red>Confirm merging of patients - this action is irreversible.</Red>
    <p>
      Merging patients can't be undone. Please allow 24 hours for
      for this change to be synced throughout the entire system.
    </p>
  </div>
);

export const ConfirmationModal = ({
  mergePlan,
  onCancel,
  onConfirm,
}) => {
  const actions = (
    <ConfirmCancelRow
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
  return (
    <Modal 
      title="Merge patients"
      actions={actions}
      open
      onClose={onCancel}
    >
      <ConfirmInstructions />
      <PatientSummary 
        heading="Patient to keep"
        patient={mergePlan.keepPatient} 
        selected 
      />
      <PatientSummary
        heading="Patient to merge"
        patient={mergePlan.removePatient}
      />
    </Modal>
  );
}