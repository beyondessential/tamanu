import React, { memo, useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import styled from 'styled-components';
import { Typography } from '@material-ui/core';
import { Colors } from '../constants';
import { useApi } from '../api';
import { ConfirmModal } from './ConfirmModal';
import { usePatientNavigation } from '../utils/usePatientNavigation';
import { reloadPatient } from '../store/patient';

const TypographyLink = styled(Typography)`
  color: ${Colors.primary};
  font-weight: 500;
  font-size: 14px;
  line-height: 18px;
  text-decoration: underline;
  text-align: right;
  cursor: pointer;
`;

export const RecordDeathSection = memo(({ patient, openModal }) => {
  const api = useApi();
  const dispatch = useDispatch();
  const { navigateToPatient } = usePatientNavigation();
  const queryClient = useQueryClient();
  const [isRevertModalOpen, setRevertModalOpen] = useState(false);
  const openRevertModal = useCallback(() => setRevertModalOpen(true), [setRevertModalOpen]);
  const closeRevertModal = useCallback(() => setRevertModalOpen(false), [setRevertModalOpen]);
  const revertDeath = async () => {
    const patientId = patient.id;
    await api.post(`patient/${patientId}/revertDeath`);
    queryClient.invalidateQueries(['patientDeathSummary', patient.id]);

    closeRevertModal();
    await dispatch(reloadPatient(patientId));
    navigateToPatient(patientId);
  };

  const isPatientDead = Boolean(patient.dateOfDeath);
  const actionText = isPatientDead ? 'Revert death record' : 'Record death';

  return (
    <>
      <TypographyLink onClick={isPatientDead ? openRevertModal : openModal}>
        {actionText}
      </TypographyLink>
      <ConfirmModal
        open={isRevertModalOpen}
        title="Revert patient death"
        subText="Are you sure you want to revert the patient death record? This will not reopen any previously closed encounters."
        onConfirm={revertDeath}
        onCancel={closeRevertModal}
      />
    </>
  );
});
