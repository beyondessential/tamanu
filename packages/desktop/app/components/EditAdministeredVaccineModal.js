import React, { useState, useCallback } from 'react';
import styled from 'styled-components';

import { VACCINE_STATUS } from 'shared/constants';

import { Modal } from './Modal';

import { connectApi } from '../api/connectApi';
import { reloadPatient } from '../store/patient';

import { ContentPane } from './ContentPane';
import { DeleteButton } from './Button';
import { TextInput } from './Field';
import { FormGrid } from './FormGrid';
import { ConfirmModal } from './ConfirmModal';

const Button = styled(DeleteButton)`
  margin-top: 2em;
`;

const ModalContent = React.memo(({ open, onClose, onMarkRecordedInError, vaccineRecord }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const closeWithoutDeletingRecord = useCallback(() => {
    setConfirmDelete(false);
    onClose();
  }, [onClose]);

  if (!vaccineRecord) return null;

  const {
    status,
    injectionSite,
    scheduledVaccine: { label, schedule },
    recorder,
    givenBy,
    location,
    encounter,
  } = vaccineRecord;

  if (confirmDelete) {
    return (
      <ConfirmModal
        title="Delete Vaccination Record"
        text="WARNING: This action is irreversible!"
        subText="Are you sure you want to delete this vaccination record?"
        open={open}
        onCancel={closeWithoutDeletingRecord}
        onConfirm={onMarkRecordedInError}
        ConfirmButton={DeleteButton}
        cancelButtonText="No"
        confirmButtonText="Yes"
      />
    );
  }

  return (
    <Modal title="Edit Vaccination Record" open={open} onClose={closeWithoutDeletingRecord}>
      <ContentPane>
        <FormGrid columns={2}>
          <TextInput disabled value={`${label} (${schedule})`} label="Vaccine" />
          <TextInput disabled value={status} label="Status" />
          <TextInput disabled value={injectionSite} label="Injection site" />
          <TextInput
            disabled
            value={location?.name || encounter?.location?.name}
            label="Facility"
          />
          {givenBy && <TextInput disabled value={givenBy} label="Giver" />}
          <TextInput
            disabled
            value={recorder?.displayName || encounter?.examiner?.displayName}
            label="Recorder"
          />
        </FormGrid>
        <Button onClick={() => setConfirmDelete(true)} variant="contained" color="primary">
          DELETE RECORD
        </Button>
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
