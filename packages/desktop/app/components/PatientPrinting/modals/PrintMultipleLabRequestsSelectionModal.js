import React from 'react';
import PropTypes from 'prop-types';

import { FormModal } from '../../FormModal';
import { PrintMultipleLabRequestsSelectionForm } from './PrintMultipleLabRequestsSelectionForm';

export const PrintMultipleLabRequestsSelectionModal = ({ encounter, open, onClose }) => {
  return (
    <FormModal title="Print lab requests" width="xl" open={open} onClose={onClose} fullWidth={false}>
      <PrintMultipleLabRequestsSelectionForm encounter={encounter} onClose={onClose} />
    </FormModal>
  );
};

PrintMultipleLabRequestsSelectionModal.propTypes = {
  encounter: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
