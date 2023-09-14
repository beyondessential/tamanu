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

export const DeleteProgramRegistryFormModal = ({ programRegistry, onSubmit, onCancel, open }) => {
  return (
    <Modal title="Delete record" open={open}>
      <div>
        <Text>
          <p>
            {`Are you sure you would like to delete the patient from the ${programRegistry.name} program registry? This will delete associated patient registry records. This action is irreversible.`}
          </p>
        </Text>
        <FormSeparatorLine style={{ marginTop: '30px', marginBottom: '30px' }} />
        <ConfirmCancelRow onConfirm={onSubmit} onCancel={onCancel} />
      </div>
    </Modal>
  );
};
