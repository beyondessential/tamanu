import React from 'react';

import { Modal } from '../Modal';
import { PrintMultipleMedicationSelectionForm } from './PrintMultipleMedicationSelectionForm';

export const PrintMultipleMedicationSelectionModal = ({ encounter, open, onClose }) => {
  return (
    <Modal title="Print prescriptions" width="md" open={open} onClose={onClose}>
      <PrintMultipleMedicationSelectionForm
        encounter={encounter}
        onSubmit={() => true}
        onClose={onClose}
      />
    </Modal>
  );
};
