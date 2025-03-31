import React, { useState } from 'react';
import styled from 'styled-components';
import { Button, ButtonRow, Modal, OutlinedButton } from '../../../components';

import { PatientSummary } from './PatientSummary';

const Red = styled.p`
  color: #f00;
`;

const ConfirmInstructions = () => (
  <div>
    <Red>Confirm merging of patients - this action is irreversible.</Red>
    <p data-testid='p-yyk8'>
      {`Merging patients can't be undone. Please allow 24 hours for this change to be synced
      throughout the entire system.`}
    </p>
  </div>
);

const Spacer = styled.div`
  flex-grow: 1;
`;

export const ConfirmationModal = ({ mergePlan, onCancel, onBack, onConfirm }) => {
  const [inProgress, setInProgress] = useState(false);
  const onConfirmClicked = () => {
    setInProgress(true);
    onConfirm();
  };

  const actions = (
    <ButtonRow data-testid='buttonrow-o48d'>
      <OutlinedButton disabled={inProgress} onClick={onBack} data-testid='outlinedbutton-tjyo'>
        Back
      </OutlinedButton>
      <Spacer />
      <OutlinedButton
        disabled={inProgress}
        onClick={onCancel}
        data-testid='outlinedbutton-6naz'>
        Cancel
      </OutlinedButton>
      <Button
        disabled={inProgress}
        onClick={onConfirmClicked}
        data-testid='button-avxk'>
        Confirm
      </Button>
    </ButtonRow>
  );
  return (
    <Modal title="Merge patients" actions={actions} open onClose={onCancel}>
      <ConfirmInstructions />
      <PatientSummary heading="Patient to keep" patient={mergePlan.keepPatient} selected />
      <PatientSummary heading="Patient to merge" patient={mergePlan.removePatient} />
    </Modal>
  );
};
