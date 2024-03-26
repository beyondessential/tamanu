import React from 'react';
import styled from 'styled-components';
import { useApi } from '../../../api';
import { ConfirmModal } from '../../../components/ConfirmModal';

const SubText = styled.div`
  text-align: left;
  padding: 30px;
`;

export const DeleteProgramResponseModal = ({ open, onClose, surveyResponseToDelete, endpoint }) => {
  const api = useApi();

  const onSubmit = async () => {
    await api.delete(`${endpoint}/${surveyResponseToDelete.id}`);
    onClose();
  };

  return (
    <ConfirmModal
      width="md"
      title="Delete program form"
      subText={
        <SubText>
          This action is irreversible.
          <br />
          <br />
          Are you sure you would like to delete the &apos;
          <strong>{surveyResponseToDelete?.surveyName}</strong>&apos; program form?
        </SubText>
      }
      open={open}
      onCancel={onClose}
      onConfirm={onSubmit}
    />
  );
};
