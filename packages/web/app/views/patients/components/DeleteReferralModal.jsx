import React from 'react';
import styled from 'styled-components';
import { useApi } from '../../../api';
import { ConfirmModal } from '../../../components/ConfirmModal';

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
      width="md"
      title="Delete referral"
      subText={
        <SubText>
          This action is irreversible.
          <br />
          <br />
          Are you sure you would like to delete the &apos;
          <strong>{referralName}</strong>&apos;?
        </SubText>
      }
      open={open}
      onCancel={onClose}
      onConfirm={onSubmit}
    />
  );
};
