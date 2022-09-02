import React from 'react';
import { ButtonRow, Button, Modal } from '../../../components';

export const MergeErrorModal = ({ error, onClose }) => {
  const actions = (
    <ButtonRow>
      <Button onClick={onClose}>OK</Button>
    </ButtonRow>
  );
  return (
    <Modal title={`Merge patients: ${error.name}`} actions={actions} open onClose={onClose}>
      <p>
        <strong>An error occurred during merge:</strong>
      </p>
      <p>{error.message}</p>
    </Modal>
  );
};
