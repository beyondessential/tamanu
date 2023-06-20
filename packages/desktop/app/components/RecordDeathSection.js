import React, { memo, useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import styled from 'styled-components';
import { Typography, Divider } from '@material-ui/core';
import { Colors } from '../constants';
import { useApi } from '../api';
import { ConfirmModal } from './ConfirmModal';
import { usePatientNavigation } from '../utils/usePatientNavigation';
import { reloadPatient } from '../store/patient';
import { MODAL_PADDING_LEFT_AND_RIGHT, MODAL_PADDING_TOP_AND_BOTTOM } from './Modal';

const TypographyLink = styled(Typography)`
  color: ${Colors.primary};
  font-weight: 500;
  font-size: 14px;
  line-height: 18px;
  text-decoration: underline;
  text-align: right;
  cursor: pointer;
  padding-top: 10px;
  margin-top: auto;
`;

const marginBottom = 58;
const marginTop = marginBottom - MODAL_PADDING_TOP_AND_BOTTOM;
const marginLeftAndRight = 80 - MODAL_PADDING_LEFT_AND_RIGHT;
const Content = styled.p`
  text-align: left;
  margin: ${marginTop}px ${marginLeftAndRight}px ${marginBottom}px;
  font-size: 14px;
  line-height: 18px;
`;

const ComponentDivider = styled(Divider)`
  margin: 0 -${MODAL_PADDING_LEFT_AND_RIGHT}px 30px -${MODAL_PADDING_LEFT_AND_RIGHT}px;
`;

const customContent = (
  <div>
    <Content>
      Are you sure you want to revert the patient death record? This will not reopen any previously
      closed encounters.
    </Content>
    <ComponentDivider />
  </div>
);

export const RecordDeathSection = memo(({ patient, openDeathModal }) => {
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
    queryClient.resetQueries(['patientDeathSummary', patient.id]);

    closeRevertModal();
    await dispatch(reloadPatient(patientId));
    navigateToPatient(patientId);
  };

  const isPatientDead = Boolean(patient.dateOfDeath);
  const actionText = isPatientDead ? 'Revert death record' : 'Record death';

  return (
    <>
      <TypographyLink onClick={isPatientDead ? openRevertModal : openDeathModal}>
        {actionText}
      </TypographyLink>
      <ConfirmModal
        open={isRevertModalOpen}
        title="Revert patient death"
        customContent={customContent}
        onConfirm={revertDeath}
        onCancel={closeRevertModal}
      />
    </>
  );
});
