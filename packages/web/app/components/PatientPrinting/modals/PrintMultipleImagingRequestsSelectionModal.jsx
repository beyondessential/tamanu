import React from 'react';
import PropTypes from 'prop-types';

import { FormModal } from '../../FormModal';
import { PrintMultipleImagingRequestsSelectionForm } from './PrintMultipleImagingRequestsSelectionForm';
import { TranslatedText } from '../../Translation/TranslatedText';

export const PrintMultipleImagingRequestsSelectionModal = ({ encounter, open, onClose }) => {
  return (
    <FormModal
      title={
        <TranslatedText
          stringId="imaging.modal.printMultiple.title"
          fallback="Print imaging request/s"
          data-testid='translatedtext-7l2l' />
      }
      width="md"
      open={open}
      onClose={onClose}
      data-testid='formmodal-742i'>
      <PrintMultipleImagingRequestsSelectionForm
        encounter={encounter}
        onClose={onClose}
        data-testid='printmultipleimagingrequestsselectionform-t4lp' />
    </FormModal>
  );
};

PrintMultipleImagingRequestsSelectionModal.propTypes = {
  encounter: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
