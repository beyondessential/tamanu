import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { VACCINE_STATUS } from 'shared/constants';
import { useDispatch } from 'react-redux';
import { useApi } from '../api';
import { reloadPatient } from '../store/patient';
import { DeleteButton } from './Button';
import { ConfirmModal } from './ConfirmModal';

const Button = styled(DeleteButton)`
  margin-top: 2em;
`;

export const DeleteAdministeredVaccineModal = ({ open, onClose, patientId, vaccineRecord }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const closeWithoutDeletingRecord = useCallback(() => {
    setConfirmDelete(false);
    onClose();
  }, [onClose]);

  const api = useApi();
  const dispatch = useDispatch();

  const onMarkRecordedInError = useCallback(async () => {
    await api.put(`patient/${patientId}/administeredVaccine/${vaccineRecord.id}`, {
      status: VACCINE_STATUS.RECORDED_IN_ERROR,
    });
    dispatch(reloadPatient(patientId));
  }, [patientId, vaccineRecord, dispatch, api]);

  if (!vaccineRecord) return null;

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

};
