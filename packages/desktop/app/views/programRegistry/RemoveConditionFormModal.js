import React from 'react';
import styled from 'styled-components';
import { Modal, ConfirmCancelRow, FormSeparatorLine } from '../../components';

const Text = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-content: center;
  p {
    text-align: start;
  }
`;

export const RemoveConditionFormModal = ({ condition, onSubmit, onCancel, open }) => {
  return (
    <Modal title="Remove condition" open={open} onClose={onCancel}>
      <Text>
        <p>
          {`Are you sure you would like to remove the condition of  ‘${condition.name}' from the patients program condition record?`}
        </p>
      </Text>
      <FormSeparatorLine style={{ marginTop: '30px', marginBottom: '30px' }} />
      <ConfirmCancelRow onConfirm={onSubmit} onCancel={onCancel} />
    </Modal>
  );
};
