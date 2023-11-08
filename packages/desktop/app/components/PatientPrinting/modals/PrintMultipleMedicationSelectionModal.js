import React from 'react';
import PropTypes from 'prop-types';

import { FormModal } from '../../FormModal';
import { PrintMultipleMedicationSelectionForm } from './PrintMultipleMedicationSelectionForm';

export const PrintMultipleMedicationSelectionModal = ({ encounter, open, onClose }) => {
  return (
    <FormModal title="Print prescriptions" width="md" open={open} onClose={onClose}>
      <PrintMultipleMedicationSelectionForm encounter={encounter} onClose={onClose} />
    </FormModal>
  );
};

PrintMultipleMedicationSelectionModal.propTypes = {
  encounter: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
