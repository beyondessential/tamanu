import React from 'react';
import styled from 'styled-components';
import { useApi } from '../../../api';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { TranslatedText } from '../../../components/Translation/TranslatedText';

const SubText = styled.div`
  text-align: left;
  padding: 30px;
`;

export const DeleteDocumentModal = ({ open, onClose, documentToDelete, endpoint }) => {
  const api = useApi();

  const onSubmit = async () => {
    await api.delete(`${endpoint}/${documentToDelete.id}`);
    onClose();
  };

  return (
    <ConfirmModal
      title={
        <TranslatedText
          stringId="document.delete.title"
          fallback="Delete document"
          data-testid="translatedtext-delete-document-title"
        />
      }
      subText={
        <SubText data-testid="subtext-vqro">
          <TranslatedText
            stringId="general.warning.irreversible"
            fallback="This action is irreversible."
            data-testid="translatedtext-warning-irreversible"
          />
          <br />
          <br />
          <TranslatedText
            stringId="document.delete.confirmation"
            fallback="Are you sure you would like to delete the :documentName document?"
            replacements={{ documentName: documentToDelete?.name }}
            data-testid="translatedtext-delete-document-confirmation"
          />
        </SubText>
      }
      open={open}
      onCancel={onClose}
      onConfirm={onSubmit}
      data-testid="confirmmodal-w304"
    />
  );
};
