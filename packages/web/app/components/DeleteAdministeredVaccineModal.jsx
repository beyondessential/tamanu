import React, { useCallback } from 'react';
import { VACCINE_STATUS } from '@tamanu/constants';
import { DeleteButton } from '@tamanu/ui-components';

import { useQueryClient } from '@tanstack/react-query';
import { useApi } from '../api';
import { ConfirmModal } from './ConfirmModal';
import { TranslatedText } from './Translation/TranslatedText';

export const DeleteAdministeredVaccineModal = ({ open, onClose, patientId, vaccineRecord }) => {
  const api = useApi();
  const queryClient = useQueryClient();

  const onMarkRecordedInError = useCallback(async () => {
    await api.put(`patient/${patientId}/administeredVaccine/${vaccineRecord.id}`, {
      status: VACCINE_STATUS.RECORDED_IN_ERROR,
    });
    queryClient.invalidateQueries(['patientDetails', patientId]);
  }, [patientId, vaccineRecord, queryClient, api]);

  if (!vaccineRecord) return null;

  return (
    <ConfirmModal
      title={
        <TranslatedText
          stringId="vaccine.modal.delete.title"
          fallback="Delete vaccination record"
          data-testid="translatedtext-7wfv"
        />
      }
      text={
        <TranslatedText
          stringId="vaccine.modal.delete.text"
          fallback="WARNING: This action is irreversible!"
          data-testid="translatedtext-z146"
        />
      }
      subText={
        <TranslatedText
          stringId="vaccine.modal.delete.subText"
          fallback="Are you sure you want to delete this vaccination record?"
          data-testid="translatedtext-cvhv"
        />
      }
      open={open}
      onCancel={onClose}
      onConfirm={onMarkRecordedInError}
      ConfirmButton={DeleteButton}
      cancelButtonText={
        <TranslatedText
          stringId="general.action.no"
          fallback="No"
          data-testid="translatedtext-qe6j"
        />
      }
      confirmButtonText={
        <TranslatedText
          stringId="general.action.yes"
          fallback="Yes"
          data-testid="translatedtext-avqb"
        />
      }
      data-testid="confirmmodal-srxd"
    />
  );
};
