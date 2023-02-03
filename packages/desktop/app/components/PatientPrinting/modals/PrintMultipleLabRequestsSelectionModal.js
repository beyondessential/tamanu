import React from 'react';
import PropTypes from 'prop-types';

import { Modal } from '../../Modal';
import { PrintMultipleLabRequestsSelectionForm } from './PrintMultipleLabRequestsSelectionForm';

export const PrintMultipleLabRequestsSelectionModal = ({ encounter, open, onClose }) => {
  return (
    <Modal title="Print lab requests" width="md" open={open} onClose={onClose}>
      <PrintMultipleLabRequestsSelectionForm encounter={encounter} onClose={onClose} />
    </Modal>
  );
};

PrintMultipleLabRequestsSelectionModal.propTypes = {
  encounter: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
