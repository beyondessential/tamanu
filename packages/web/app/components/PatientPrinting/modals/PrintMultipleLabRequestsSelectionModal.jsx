import React from 'react';
import PropTypes from 'prop-types';

import { FormModal } from '../../FormModal';
import { PrintMultipleLabRequestsSelectionForm } from './PrintMultipleLabRequestsSelectionForm';
import { TranslatedText } from '../../Translation/TranslatedText';

export const PrintMultipleLabRequestsSelectionModal = ({ encounter, open, onClose }) => {
  return (
    <FormModal
      title={
        <TranslatedText
          stringId="lab.modal.printMultiple.title"
          fallback="Print lab requests"
          data-testid="translatedtext-vbgj"
        />
      }
      width="xl"
      open={open}
      onClose={onClose}
      fullWidth={false}
      data-testid="formmodal-945u"
    >
      <PrintMultipleLabRequestsSelectionForm
        encounter={encounter}
        onClose={onClose}
        data-testid="printmultiplelabrequestsselectionform-4zkc"
      />
    </FormModal>
  );
};

PrintMultipleLabRequestsSelectionModal.propTypes = {
  encounter: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
