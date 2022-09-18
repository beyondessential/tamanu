import React, { useState } from 'react';
import styled from 'styled-components';
import { ButtonRow, Button, OutlinedButton, Modal } from '../../../components';

import { PatientSummary } from './PatientSummary';

const Red = styled.p`
  color: #f00;
`;

const ConfirmInstructions = () => (
  <div>
    <Red>Confirm merging of patients - this action is irreversible.</Red>
    <p>{`Merging patients can't be undone. Please allow 24 hours for this change to be synced
      throughout the entire system.`}</p>
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
    <ButtonRow>
      <OutlinedButton disabled={inProgress} onClick={onBack}>
        Back
      </OutlinedButton>
      <Spacer />
      <OutlinedButton disabled={inProgress} onClick={onCancel}>
        Cancel
      </OutlinedButton>
      <Button disabled={inProgress} onClick={onConfirmClicked}>
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
