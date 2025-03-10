import React from 'react';
import styled from 'styled-components';
import { Modal, ModalCancelRow, TranslatedText } from '../../components';

const Text = styled.div`
  padding: 45px 0 60px;
  line-height: 1.5;
`;

export const RecordedInErrorWarningModal = ({ onConfirm, onClose, open }) => {
  return (
    <Modal
      title={
        <TranslatedText
          stringId="patientProgramRegistry.recordedInErrorWarning.title"
          fallback="Change status to recorded in error"
        />
      }
      width="sm"
      open={open}
      onClose={onClose}
    >
      <Text>
        <TranslatedText
          stringId="patientProgramRegistry.recordedInErrorWarning.text"
          fallback="Are you sure you would like to change the status to ‘Recorded in error’? This action is irreversible."
        />
      </Text>
      <ModalCancelRow onConfirm={onConfirm} onCancel={onClose} />
    </Modal>
  );
};
