import React from 'react';
import styled from 'styled-components';
import { useApi } from '../../../api';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { TranslatedText } from '../../../components/Translation/TranslatedText';

const SubText = styled.div`
  text-align: left;
  padding: 30px;
`;

export const DeleteReferralModal = ({ open, onClose, referralToDelete, endpoint }) => {
  const api = useApi();

  const onSubmit = async () => {
    await api.delete(`${endpoint}/${referralToDelete.id}`);
    onClose();
  };

  const referralName = referralToDelete ? referralToDelete.surveyResponse.survey.name : '';

  return (
    <ConfirmModal
      title={
        <TranslatedText
          stringId="referral.modal.delete.title"
          fallback="Delete referral"
          data-testid="translatedtext-referral-modal-delete-title"
        />
      }
      subText={
        <SubText data-testid="subtext-k8va">
          <TranslatedText
            stringId="general.warning.irreversible"
            fallback="This action is irreversible."
            data-testid="translatedtext-warning-irreversible"
          />
          <br />
          <br />
          <TranslatedText
            stringId="referral.modal.delete.confirmation.prefix"
            fallback="Are you sure you would like to delete the"
            data-testid="translatedtext-referral-modal-delete-confirmation-prefix"
          />{' '}
          <strong>{referralName}</strong>{' '}
          <TranslatedText
            stringId="referral.modal.delete.confirmation.suffix"
            fallback="?"
            data-testid="translatedtext-referral-modal-delete-confirmation-suffix"
          />
        </SubText>
      }
      open={open}
      onCancel={onClose}
      onConfirm={onSubmit}
      data-testid="confirmmodal-dy1r"
    />
  );
};
