import React from 'react';
import PropTypes from 'prop-types';

import { FormModal } from '../../FormModal';
import { PrintMultipleMedicationSelectionForm } from './PrintMultipleMedicationSelectionForm';
import { TranslatedText } from '../../Translation/TranslatedText';

export const PrintMultipleMedicationSelectionModal = ({ encounter, open, onClose }) => {
  return (
    <FormModal
      title={
        <TranslatedText
          stringId="medication.modal.printMultiple.title"
          fallback="Print prescriptions"
          data-testid='translatedtext-rrc8' />
      }
      width="md"
      open={open}
      onClose={onClose}
      data-testid='formmodal-i302'>
      <PrintMultipleMedicationSelectionForm
        encounter={encounter}
        onClose={onClose}
        data-testid='printmultiplemedicationselectionform-xffp' />
    </FormModal>
  );
};

PrintMultipleMedicationSelectionModal.propTypes = {
  encounter: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
