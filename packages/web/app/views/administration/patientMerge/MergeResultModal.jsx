import React from 'react';
import { Button, ButtonRow, Modal } from '@tamanu/ui-components';

export const MergeResultModal = ({ result, onClose }) => {
  const { updates = {} } = result;

  const actions = (
    <ButtonRow data-testid="buttonrow-l9vl">
      <Button onClick={onClose} data-testid="button-3gs0">
        OK
      </Button>
    </ButtonRow>
  );
  return (
    <Modal title="Merge patients" actions={actions} open onClose={onClose} data-testid="modal-yazr">
      <p>
        <strong>Merge successful.</strong> Records updated:
      </p>
      <ul>
        {Object.entries(updates).map(([modelName, count]) => (
          <li data-testid={`li-pp3g-${modelName}`} key={modelName}>
            <span>{`${modelName}: `}</span>
            <strong>{count}</strong>
          </li>
        ))}
      </ul>
    </Modal>
  );
};
