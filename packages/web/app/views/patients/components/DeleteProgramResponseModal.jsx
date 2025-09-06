import React from 'react';
import styled from 'styled-components';
import { useApi } from '../../../api';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { TranslatedText } from '../../../components/Translation/TranslatedText';

const SubText = styled.div`
  text-align: left;
  padding: 30px;
`;

export const DeleteProgramResponseModal = ({
  open,
  onClose,
  onDelete,
  surveyResponseToDelete,
  endpoint,
}) => {
  const api = useApi();

  const onSubmit = async () => {
    await api.delete(`${endpoint}/${surveyResponseToDelete.id}`);
    if (onDelete) {
      onDelete();
    }
    onClose();
  };

  return (
    <ConfirmModal
      title={
        <TranslatedText
          stringId="program.modal.delete.title"
          fallback="Delete program form"
          data-testid="translatedtext-program-modal-delete-title"
        />
      }
      subText={
        <SubText data-testid="subtext-u6n1">
          <TranslatedText
            stringId="program.modal.delete.confirmation.prefix"
            fallback="Are you sure you would like to delete the "
            data-testid="translatedtext-program-modal-delete-confirmation-prefix"
          />
          <strong>‘{surveyResponseToDelete?.surveyName}’</strong>
          <TranslatedText
            stringId="program.modal.delete.confirmation.suffix"
            fallback=" program form?"
            data-testid="translatedtext-program-modal-delete-confirmation-suffix"
          />
          <br />
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
      confirmButtonText={
        <TranslatedText
          stringId="program.modal.delete.button.test"
          fallback="Delete form"
          data-testid="translatedtext-40y7"
        />
      }
      data-testid="confirmmodal-sg1c"
    />
  );
};
