import React, { useCallback } from 'react';
import PropTypes from 'prop-types';

import { useApi } from '../api';
import { Modal } from './Modal';
import { PatientLetterForm } from '../forms/PatientLetterForm';

export const PatientLetterModal = React.memo(
  ({ open, onClose, endpoint, refreshTable, patient, openDocumentPreview }) => {
    const api = useApi();

    const onSubmit = useCallback(
      async ({ printRequested, ...data }) => {
        const document = await api.post(`${endpoint}/createPatientLetter`, {
          patientLetterData: {
            ...data,
            patient,
          },
          name: data.title,
          clinicianId: data.clinicianId,
        });

        refreshTable();
        onClose();
        if (printRequested) {
          openDocumentPreview(document);
        }
      },
      [onClose, api, endpoint, refreshTable, openDocumentPreview],
    );

    return (
      <Modal width="sm" title="Patient letter" open={open} onClose={onClose}>
        <PatientLetterForm patient={patient} onSubmit={onSubmit} onCancel={onClose} />
      </Modal>
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
