import React from 'react';
import PropTypes from 'prop-types';

import { FormModal } from '../../FormModal';
import { PrintMultipleImagingRequestsSelectionForm } from './PrintMultipleImagingRequestsSelectionForm';
import { TranslatedText } from '../../Translation/TranslatedText';

export const PrintMultipleImagingRequestsSelectionModal = ({ encounter, open, onClose }) => {
  return (
    <FormModal
      title={
        <TranslatedText stringId="imaging.modal.printMultiple.title" fallback="Print imaging request/s" />
      }
      width="md"
      open={open}
      onClose={onClose}
    >
      <PrintMultipleImagingRequestsSelectionForm encounter={encounter} onClose={onClose} />
    </FormModal>
  );
};

PrintMultipleImagingRequestsSelectionModal.propTypes = {
  encounter: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
