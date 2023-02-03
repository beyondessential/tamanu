import React from 'react';
import PropTypes from 'prop-types';

import { Modal } from '../../Modal';
import { PrintMultipleMedicationSelectionForm } from './PrintMultipleMedicationSelectionForm';

export const PrintMultipleMedicationSelectionModal = ({ encounter, open, onClose }) => {
  return (
    <Modal title="Print prescriptions" width="md" open={open} onClose={onClose}>
      <PrintMultipleMedicationSelectionForm encounter={encounter} onClose={onClose} />
    </Modal>
  );
};

PrintMultipleMedicationSelectionModal.propTypes = {
  encounter: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
