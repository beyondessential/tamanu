import React, { useState } from 'react';
import styled from 'styled-components';
import { Button, ButtonRow, OutlinedButton, Modal } from '@tamanu/ui-components';

import { PatientSummary } from './PatientSummary';

const Red = styled.p`
  color: #f00;
`;

const ConfirmInstructions = () => (
  <div>
    <Red data-testid="red-pjak">Confirm merging of patients - this action is irreversible.</Red>
    <p>
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
    <ButtonRow data-testid="buttonrow-cnys">
      <OutlinedButton disabled={inProgress} onClick={onBack} data-testid="outlinedbutton-9yl7">
        Back
      </OutlinedButton>
      <Spacer data-testid="spacer-dcca" />
      <OutlinedButton disabled={inProgress} onClick={onCancel} data-testid="outlinedbutton-veiz">
        Cancel
      </OutlinedButton>
      <Button disabled={inProgress} onClick={onConfirmClicked} data-testid="button-hjoz">
        Confirm
      </Button>
    </ButtonRow>
  );
  return (
    <Modal
      title="Merge patients"
      actions={actions}
      open
      onClose={onCancel}
      data-testid="modal-qq9u"
    >
      <ConfirmInstructions data-testid="confirminstructions-mhpf" />
      <PatientSummary
        heading="Patient to keep"
        patient={mergePlan.keepPatient}
        selected
        data-testid="patientsummary-7kbg"
      />
      <PatientSummary
        heading="Patient to merge"
        patient={mergePlan.removePatient}
        data-testid="patientsummary-cpc6"
      />
    </Modal>
  );
};
