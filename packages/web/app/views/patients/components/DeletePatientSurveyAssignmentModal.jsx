import React from 'react';
import styled from 'styled-components';
import { useApi } from '../../../api';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { TranslatedText } from '../../../components/Translation/TranslatedText';

const SubText = styled.div`
  text-align: left;
  padding: 30px;
`;

export const DeletePatientSurveyAssignmentModal = ({
  open,
  onClose,
  patientSurveyAssignmentToDelete,
  patient,
}) => {
  const api = useApi();

  const onSubmit = async () => {
    await api.delete(`patient/${patient.id}/portal/forms/${patientSurveyAssignmentToDelete.id}`);
    onClose();
  };

  return (
    <ConfirmModal
      title={
        <TranslatedText
          stringId="patientSurveyAssignment.modal.delete.title"
          fallback="Delete survey assignment"
          data-testid="translatedtext-patient-survey-assignment-modal-delete-title"
        />
      }
      subText={
        <SubText data-testid="subtext-patient-survey-assignment-delete">
          <TranslatedText
            stringId="general.warning.irreversible"
            fallback="This action is irreversible."
            data-testid="translatedtext-warning-irreversible"
          />
          <br />
          <br />
          <TranslatedText
            stringId="patientSurveyAssignment.modal.delete.confirmation.prefix"
            fallback="Are you sure you would like to delete the"
            data-testid="translatedtext-patient-survey-assignment-modal-delete-confirmation-prefix"
          />{' '}
          <strong>{patientSurveyAssignmentToDelete?.survey?.name}</strong>{' '}
          <TranslatedText
            stringId="patientSurveyAssignment.modal.delete.confirmation.suffix"
            fallback="survey assignment?"
            data-testid="translatedtext-patient-survey-assignment-modal-delete-confirmation-suffix"
          />
        </SubText>
      }
      open={open}
      onCancel={onClose}
      onConfirm={onSubmit}
      data-testid="confirmmodal-patient-survey-assignment-delete"
    />
  );
};
