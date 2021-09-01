import React, { useState, useCallback } from 'react';
import styled from 'styled-components';

import { Modal } from './Modal';
import { ConfirmAdministeredVaccineDelete } from './ConfirmAdministeredVaccineDelete';

import { connectApi } from '../api/connectApi';
import { reloadPatient } from '../store/patient';

import { VACCINE_STATUS } from '../constants';
import { ContentPane } from './ContentPane';
import { DeleteButton } from './Button';
import { TextInput } from './Field';
import { FormGrid } from './FormGrid';

const Button = styled(DeleteButton)`
  margin-top: 12px;
`;

const ModalContent = React.memo(({ open, onClose, onMarkRecordedInError, vaccineRecord }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const closeWithoutDeletingRecord = useCallback(() => {
    setConfirmDelete(false);
    onClose();
  }, []);

  if (!vaccineRecord) return null;

  const {
    status,
    injectionSite,
    scheduledVaccine: { label, schedule },
    encounter: {
      examiner: { displayName },
    },
  } = vaccineRecord;

  if (confirmDelete) {
    return (
      <Modal title="Delete Vaccination Record" open={open} onClose={closeWithoutDeletingRecord}>
        <ContentPane>
          <ConfirmAdministeredVaccineDelete
            onDelete={onMarkRecordedInError}
            onClose={closeWithoutDeletingRecord}
          />
        </ContentPane>
      </Modal>
    );
  }

  return (
    <Modal title="Edit Vaccination Record" open={open} onClose={closeWithoutDeletingRecord}>
      <ContentPane>
        <FormGrid columns={2}>
          <TextInput disabled value={`${label} (${schedule})`} label="Vaccine" />
          <TextInput disabled value={status} label="Status" />
          <TextInput disabled value={injectionSite} label="Injection site" />
          <TextInput disabled value={displayName} label="Practitioner" />
          <Button onClick={() => setConfirmDelete(true)} variant="contained" color="primary">
            DELETE RECORD
          </Button>
        </FormGrid>
      </ContentPane>
    </Modal>
  );
});

export const EditAdministeredVaccineModal = connectApi(
  (api, dispatch, { patientId, vaccineRecord }) => ({
    onMarkRecordedInError: async () => {
      await api.put(`patient/${patientId}/administeredVaccine/${vaccineRecord.id}`, {
        status: VACCINE_STATUS.RECORDED_IN_ERROR,
      });
      dispatch(reloadPatient(patientId));
    },
  }),
)(ModalContent);
