import React from 'react';
import styled from 'styled-components';
import { useApi } from '../../../api';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { route } from '@tamanu/api-client';

const SubText = styled.div`
  text-align: left;
  padding: 30px;
`;

export const DeletePortalSurveyAssignmentModal = ({
  open,
  onClose,
  portalSurveyAssignmentToDelete,
  patient,
}) => {
  const api = useApi();

  const onSubmit = async () => {
    await api.delete(
      route('patient/:patientId/portal/forms/:portalSurveyAssignmentToDeleteId', {
        patientId: patient.id,
        portalSurveyAssignmentToDeleteId: portalSurveyAssignmentToDelete.id,
      }),
    );
    onClose();
  };

  return (
    <ConfirmModal
      title={
        <TranslatedText
          stringId="portalSurveyAssignment.modal.delete.title"
          fallback="Delete outstanding form"
          data-testid="translatedtext-portal-survey-assignment-modal-delete-title"
        />
      }
      subText={
        <SubText data-testid="subtext--survey-assignment-delete">
          <TranslatedText
            stringId="portalSurveyAssignment.modal.delete.confirmation"
            fallback="Are you sure you would like to delete"
            data-testid="translatedtext-portal-survey-assignment-modal-delete-confirmation"
          />{' '}
          <strong>{portalSurveyAssignmentToDelete?.survey?.name}</strong>?
          <br />
          <TranslatedText
            stringId="general.warning.irreversible"
            fallback="This action is irreversible."
            data-testid="translatedtext-warning-irreversible"
          />
        </SubText>
      }
      open={open}
      onCancel={onClose}
      onConfirm={onSubmit}
      data-testid="confirmmodal-portal-survey-assignment-delete"
    />
  );
};
