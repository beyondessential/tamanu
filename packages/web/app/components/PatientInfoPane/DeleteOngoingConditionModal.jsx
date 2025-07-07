import React from 'react';
import styled from 'styled-components';
import { useApi } from '../../api';
import { ConfirmModal } from '../ConfirmModal';
import { TranslatedText } from '../Translation/TranslatedText';
import { useTranslation } from '../../contexts/Translation';

const SubText = styled.div`
  text-align: center;
  padding: 65px 0 65px 0;
  & > b {
    font-weight: 500;
  }
`;

export const DeleteOngoingConditionModal = ({
  open,
  onClose,
  conditionToDelete,
  onDeleteSuccess,
}) => {
  const api = useApi();
  const { getTranslation } = useTranslation();

  const onSubmit = async () => {
    await api.delete(`ongoingCondition/${conditionToDelete.id}`);
    if (onDeleteSuccess) {
      onDeleteSuccess();
    }
    onClose();
  };

  const conditionName = conditionToDelete?.condition?.name || '';

  return (
    <ConfirmModal
      title={
        <TranslatedText
          stringId="conditions.modal.delete.title"
          fallback="Delete ongoing condition"
          data-testid="translatedtext-delete-condition-title"
        />
      }
      subText={
        <SubText
          data-testid="subtext-delete-condition"
          dangerouslySetInnerHTML={{
            __html: getTranslation(
              'conditions.modal.delete.description',
              'Are you sure you would like to delete :conditionName? This action is irreversible.',
              { replacements: { conditionName: `<b>${conditionName}</b>` } },
            ),
          }}
        />
      }
      open={open}
      onCancel={onClose}
      onConfirm={onSubmit}
      data-testid="confirmmodal-delete-condition"
      width="md"
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
