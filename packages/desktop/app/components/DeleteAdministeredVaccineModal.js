import React, { useCallback } from 'react';
import { VACCINE_STATUS } from '@tamanu/constants';
import { useDispatch } from 'react-redux';
import { useApi } from '../api';
import { reloadPatient } from '../store/patient';
import { DeleteButton } from './Button';
import { ConfirmModal } from './ConfirmModal';
import { TranslatedText } from './Translation/TranslatedText';

export const DeleteAdministeredVaccineModal = ({ open, onClose, patientId, vaccineRecord }) => {
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
      title={
        <TranslatedText stringId="vaccine.deleteModal.title" fallback="Delete vaccination record" />
      }
      text={
        <TranslatedText
          stringId="vaccine.deleteModal.text"
          fallback="WARNING: This action is irreversible!"
        />
      }
      subText={
        <TranslatedText
          stringId="vaccine.deleteModal.subText"
          fallback="Are you sure you want to delete this vaccination record?"
        />
      }
      open={open}
      onCancel={onClose}
      onConfirm={onMarkRecordedInError}
      ConfirmButton={DeleteButton}
      cancelButtonText={<TranslatedText stringId="general.form.no" fallback="No" />}
      confirmButtonText={<TranslatedText stringId="general.form.yes" fallback="Yes" />}
    />
  );
};
