import React from 'react';
import styled from 'styled-components';
import { useApi } from '../../../api';
import { ConfirmModal } from '../../../components/ConfirmModal';

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
      width="md"
      title="Delete document"
      subText={
        <SubText>
          This action is irreversible.
          <br />
          <br />
          Are you sure you would like to delete the &apos;
          <strong>{documentToDelete?.name}</strong>&apos; document?
        </SubText>
      }
      open={open}
      onCancel={onClose}
      onConfirm={onSubmit}
    />
  );
};
