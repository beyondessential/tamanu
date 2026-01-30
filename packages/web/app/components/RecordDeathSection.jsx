import React, { memo, useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import styled from 'styled-components';
import { Typography } from '@material-ui/core';
import { useApi } from '../api';
import { ConfirmModal } from './ConfirmModal';
import { usePatientNavigation } from '../utils/usePatientNavigation';
import { reloadPatient } from '../store/patient';
import {
  MODAL_PADDING_LEFT_AND_RIGHT,
  MODAL_PADDING_TOP_AND_BOTTOM,
  TranslatedText,
} from '@tamanu/ui-components';
import { Colors } from '../constants';

const TypographyLink = styled(Typography)`
  color: ${Colors.primary};
  font-weight: 500;
  font-size: 14px;
  line-height: 18px;
  text-align: right;
  cursor: pointer;
  padding-top: 10px;
  margin-top: auto;

  &:hover {
    text-decoration: underline;
  }
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

const customContent = (
  <div>
    <Content data-testid="content-ydlg">
      Are you sure you want to revert the patient death record? This will not reopen any previously
      closed encounters.
    </Content>
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
  const actionText = isPatientDead ? (
    <TranslatedText
      stringId="patient.detailsSidebar.revertDeath"
      fallback="Revert death record"
      data-testid="translatedtext-q5dc"
    />
  ) : (
    <TranslatedText
      stringId="patient.detailsSidebar.recordDeath"
      fallback="Record death"
      data-testid="translatedtext-igah"
    />
  );

  return (
    <>
      <TypographyLink
        onClick={isPatientDead ? openRevertModal : openDeathModal}
        data-testid="typographylink-6nzn"
      >
        {actionText}
      </TypographyLink>
      <ConfirmModal
        open={isRevertModalOpen}
        title="Revert patient death"
        customContent={customContent}
        onConfirm={revertDeath}
        onCancel={closeRevertModal}
        data-testid="confirmmodal-e3cr"
      />
    </>
  );
});
