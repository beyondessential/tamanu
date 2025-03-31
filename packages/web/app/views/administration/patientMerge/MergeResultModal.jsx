import React from 'react';
import { Button, ButtonRow, Modal } from '../../../components';

export const MergeResultModal = ({ result, onClose }) => {
  const { updates = {} } = result;

  const actions = (
    <ButtonRow data-test-id='buttonrow-9ngb'>
      <Button onClick={onClose} data-test-id='button-2ebx'>OK</Button>
    </ButtonRow>
  );
  return (
    <Modal title="Merge patients" actions={actions} open onClose={onClose}>
      <p data-test-id='p-5w04'>
        <strong>Merge successful.</strong> Records updated:
      </p>
      <ul data-test-id='ul-2265'>
        {Object.entries(updates).map(([modelName, count]) => (
          <li key={modelName} data-test-id='li-wws2'>
            <span>{`${modelName}: `}</span>
            <strong>{count}</strong>
          </li>
        ))}
      </ul>
    </Modal>
  );
};
