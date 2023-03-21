import React from 'react';
import { ButtonRow, Button, Modal } from '../../../components';

export const MergeResultModal = ({ result, onClose }) => {
  const { updates = {} } = result;

  const actions = (
    <ButtonRow>
      <Button onClick={onClose}>OK</Button>
    </ButtonRow>
  );
  return (
    <Modal title="Merge patients" actions={actions} open onClose={onClose}>
      <p>
        <strong>Merge successful.</strong> Records updated:
      </p>
      <ul>
        {Object.entries(updates).map(([modelName, count]) => (
          <li key={modelName}>
            <span>{`${modelName}: `}</span>
            <strong>{count}</strong>
          </li>
        ))}
      </ul>
    </Modal>
  );
};
