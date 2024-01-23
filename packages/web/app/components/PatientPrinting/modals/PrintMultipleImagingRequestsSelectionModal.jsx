import React from 'react';
import PropTypes from 'prop-types';

import { FormModal } from '../../FormModal';
import { PrintMultipleImagingRequestsSelectionForm } from './PrintMultipleImagingRequestsSelectionForm';

export const PrintMultipleImagingRequestsSelectionModal = ({ encounter, open, onClose }) => {
  return (
    <FormModal title="Print imaging request/s" width="md" open={open} onClose={onClose}>
      <PrintMultipleImagingRequestsSelectionForm encounter={encounter} onClose={onClose} />
    </FormModal>
  );
};

PrintMultipleImagingRequestsSelectionModal.propTypes = {
  encounter: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
