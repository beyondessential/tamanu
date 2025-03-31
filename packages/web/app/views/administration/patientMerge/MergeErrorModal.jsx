import React from 'react';
import { Button, ButtonRow, Modal } from '../../../components';

export const MergeErrorModal = ({ error, onClose }) => {
  const actions = (
    <ButtonRow data-testid='buttonrow-d6uo'>
      <Button onClick={onClose} data-testid='button-nhtx'>OK</Button>
    </ButtonRow>
  );
  return (
    <Modal title={`Merge patients: ${error.name}`} actions={actions} open onClose={onClose}>
      <p data-testid='p-j8cy'>
        <strong>An error occurred during merge:</strong>
      </p>
      <p data-testid='p-bho7'>{error.message}</p>
    </Modal>
  );
};
