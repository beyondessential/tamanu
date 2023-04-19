import React from 'react';
import PropTypes from 'prop-types';

import { Modal } from '../../Modal';
import { PrintMultipleImagingRequestsSelectionForm } from './PrintMultipleImagingRequestsSelectionForm';

export const PrintMultipleImagingRequestsSelectionModal = ({ encounter, open, onClose }) => {
  return (
    <Modal title="Print imaging request/s" width="md" open={open} onClose={onClose}>
      <PrintMultipleImagingRequestsSelectionForm encounter={encounter} onClose={onClose} />
    </Modal>
  );
};

PrintMultipleImagingRequestsSelectionModal.propTypes = {
  encounter: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
