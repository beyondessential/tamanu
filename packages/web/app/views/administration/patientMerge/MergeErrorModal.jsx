import React from 'react';
import { Button, ButtonRow, Modal } from '@tamanu/ui-components';

export const MergeErrorModal = ({ error, onClose }) => {
  const actions = (
    <ButtonRow data-testid="buttonrow-ngdk">
      <Button onClick={onClose} data-testid="button-yy9d">
        OK
      </Button>
    </ButtonRow>
  );
  return (
    <Modal
      title={`Merge patients: ${error.name}`}
      actions={actions}
      open
      onClose={onClose}
      data-testid="modal-1t8w"
    >
      <p>
        <strong>An error occurred during merge:</strong>
      </p>
      <p>{error.message}</p>
    </Modal>
  );
};
