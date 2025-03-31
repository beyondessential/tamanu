import React from 'react';
import { Button, ButtonRow, Modal } from '../../../components';

export const MergeErrorModal = ({ error, onClose }) => {
  const actions = (
    <ButtonRow data-test-id='buttonrow-d6uo'>
      <Button onClick={onClose} data-test-id='button-nhtx'>OK</Button>
    </ButtonRow>
  );
  return (
    <Modal title={`Merge patients: ${error.name}`} actions={actions} open onClose={onClose}>
      <p data-test-id='p-j8cy'>
        <strong>An error occurred during merge:</strong>
      </p>
      <p data-test-id='p-bho7'>{error.message}</p>
    </Modal>
  );
};
