import React from 'react';
import styled from 'styled-components';
import { route } from '@tamanu/api-client';
import { useApi } from '../api';
import { ConfirmModal } from './ConfirmModal';
import { TranslatedText } from './Translation/TranslatedText';

const SubText = styled.div`
  text-align: left;
  padding: 30px;
`;

// spec: PROC#confirmation
export const DeleteProcedureModal = ({ procedureToDelete, onClose, onDeleted }) => {
  const api = useApi();

  const onConfirm = async () => {
    await api.delete(route('procedure/:procedureId', { procedureId: procedureToDelete.id }));
    onDeleted();
  };

  return (
    <ConfirmModal
      title={
        <TranslatedText
          stringId="procedure.modal.delete.title"
          fallback="Delete procedure"
          data-testid="translatedtext-procedure-modal-delete-title"
        />
      }
      subText={
        <SubText data-testid="subtext-procedure-delete">
          <TranslatedText
            stringId="procedure.modal.delete.text"
            fallback="Are you sure you would like to delete this procedure? Any forms attached to this procedure will also be deleted."
            data-testid="translatedtext-procedure-modal-delete-text"
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
      open={Boolean(procedureToDelete)}
      onCancel={onClose}
      onConfirm={onConfirm}
      confirmButtonText={
        <TranslatedText
          stringId="procedure.modal.delete.action.confirm"
          fallback="Delete procedure"
          data-testid="translatedtext-procedure-modal-delete-confirm"
        />
      }
      data-testid="confirmmodal-procedure-delete"
    />
  );
};
