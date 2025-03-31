import React from 'react';
import { Button, ButtonRow, Modal } from '../../../components';

export const MergeResultModal = ({ result, onClose }) => {
  const { updates = {} } = result;

  const actions = (
    <ButtonRow data-testid='buttonrow-9ngb'>
      <Button onClick={onClose} data-testid='button-2ebx'>OK</Button>
    </ButtonRow>
  );
  return (
    <Modal title="Merge patients" actions={actions} open onClose={onClose}>
      <p data-testid='p-5w04'>
        <strong>Merge successful.</strong> Records updated:
      </p>
      <ul data-testid='ul-2265'>
        {Object.entries(updates).map(([modelName, count]) => (
          <li key={modelName} data-testid='li-wws2'>
            <span>{`${modelName}: `}</span>
            <strong>{count}</strong>
          </li>
        ))}
      </ul>
    </Modal>
  );
};
