import React from 'react';
import { ButtonRow, Button, OutlinedButton } from '../../../components';
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

const Spacer = styled.div`
  flex-grow: 1;
`;

export const ConfirmationModal = ({
  mergePlan,
  onCancel,
  onBack,
  onConfirm,
}) => {
  const actions = (
    <ButtonRow>
      <OutlinedButton onClick={onBack}>Back</OutlinedButton>
      <Spacer />
      <OutlinedButton onClick={onCancel}>Cancel</OutlinedButton>
      <Button onClick={onConfirm}>Confirm</Button>
    </ButtonRow>
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