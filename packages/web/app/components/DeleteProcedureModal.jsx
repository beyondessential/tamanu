import React from 'react';
import styled from 'styled-components';
import { MODAL_PADDING_TOP_AND_BOTTOM } from '@tamanu/ui-components';
import { useDeleteProcedureMutation } from '../api/mutations';
import { ConfirmModal } from './ConfirmModal';
import { ConfirmRowDivider } from './ConfirmRowDivider';
import { TranslatedText } from './Translation/TranslatedText';

const SubText = styled.div`
  text-align: left;
  padding: 30px;
`;

const IrreversibleWarning = styled.strong`
  font-weight: 500;
`;

const StyledConfirmModal = styled(ConfirmModal)`
  // Space the buttons evenly between the divider and the bottom edge of the modal. This margin
  // collapses with the button row's smaller top margin, so it sets the gap above the buttons alone.
  ${ConfirmRowDivider} {
    margin-block-end: ${MODAL_PADDING_TOP_AND_BOTTOM}px;
  }
`;

// spec: PROC#confirmation
export const DeleteProcedureModal = ({ procedureToDelete, onClose, onDeleted }) => {
  const { mutate: deleteProcedure, isLoading: isDeleting } = useDeleteProcedureMutation({
    onSuccess: onDeleted,
  });

  return (
    <StyledConfirmModal
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
            fallback="Are you sure you would like to delete this procedure? Please note, deleting the procedure will also delete any associated forms."
            data-testid="translatedtext-procedure-modal-delete-text"
          />
          <br />
          <br />
          <IrreversibleWarning>
            <TranslatedText
              stringId="general.warning.irreversible"
              fallback="This action is irreversible."
              data-testid="translatedtext-warning-irreversible"
            />
          </IrreversibleWarning>
        </SubText>
      }
      open={Boolean(procedureToDelete)}
      onCancel={onClose}
      onConfirm={() => deleteProcedure(procedureToDelete.id)}
      confirmButtonProps={{ isSubmitting: isDeleting }}
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
