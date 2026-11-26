import React from 'react';
import styled from 'styled-components';
import { route } from '@tamanu/api-client';
import { useApi } from '../../api';
import { Colors } from '../../constants';
import { ConfirmModal } from '../ConfirmModal';
import { TranslatedText } from '../Translation/TranslatedText';

const Content = styled.p`
  margin: 0;
  padding: 72px 0;
  color: ${Colors.darkestText};
  font-size: 14px;
  line-height: 18px;
  text-align: center;
`;

export const DeleteOngoingConditionModal = ({
  open,
  onClose,
  conditionToDelete,
  onDeleteSuccess,
}) => {
  const api = useApi();

  const onSubmit = async () => {
    await api.delete(
      route('ongoingCondition/:conditionToDeleteId', { conditionToDeleteId: conditionToDelete.id }),
    );
    if (onDeleteSuccess) {
      onDeleteSuccess();
    }
    onClose();
  };

  return (
    <ConfirmModal
      title={
        <TranslatedText
          stringId="conditions.modal.delete.title"
          fallback="Delete ongoing condition"
          data-testid="translatedtext-delete-condition-title"
        />
      }
      customContent={
        <Content data-testid="subtext-delete-condition">
          <TranslatedText
            stringId="conditions.modal.delete.confirmation"
            fallback="Are you sure you would like to delete this ongoing condition?"
          />
        </Content>
      }
      open={open}
      onCancel={onClose}
      onConfirm={onSubmit}
      data-testid="confirmmodal-delete-condition"
      confirmButtonText={
        <TranslatedText
          stringId="general.action.delete"
          fallback="Delete"
          data-testid="translatedtext-delete-condition-button"
        />
      }
    />
  );
};
