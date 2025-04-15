import React, { useCallback } from 'react';
import PropTypes from 'prop-types';

import { FormModal } from './FormModal';
import { PatientLetterForm } from '../forms/PatientLetterForm';
import { TranslatedText } from './Translation/TranslatedText';

export const PatientLetterModal = React.memo(
  ({ open, onClose, endpoint, refreshTable, patient, openDocumentPreview }) => {
    const onSubmit = useCallback(
      (documentToOpen) => {
        refreshTable();
        onClose();
        if (documentToOpen) {
          openDocumentPreview(documentToOpen);
        }
      },
      [onClose, refreshTable, openDocumentPreview],
    );

    return (
      <FormModal
        width="sm"
        title={
          <TranslatedText
            stringId="patient.modal.patientLetter.title"
            fallback="Patient letter"
            data-testid="translatedtext-wnph"
          />
        }
        open={open}
        onClose={onClose}
        data-testid="formmodal-dbal"
      >
        <PatientLetterForm
          patient={patient}
          onSubmit={onSubmit}
          onCancel={onClose}
          endpoint={endpoint}
          data-testid="patientletterform-en61"
        />
      </FormModal>
    );
  },
);

PatientLetterModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  endpoint: PropTypes.string.isRequired,
  refreshTable: PropTypes.func.isRequired,
  patient: PropTypes.object.isRequired,
  openDocumentPreview: PropTypes.func.isRequired,
};

PatientLetterModal.defaultProps = {
  open: false,
};
