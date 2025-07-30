import React, { useState } from 'react';
import { useSelector } from 'react-redux';

import {
  ConfirmCancelRow,
  Modal,
  ModalGenericButtonRow,
  TranslatedText,
  TextButton,
} from '../../../components';
import { SendIcon } from '../../../components/Icons/SendIcon';

export const SendFormToPortalModal = ({ open, onClose, patient }) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <TranslatedText
          stringId="program.action.sendToPatientPortal"
          fallback="Send to patient portal"
        />
      }
    >
      <ModalGenericButtonRow>
        <ConfirmCancelRow
          onConfirm={() => {
            console.log(patient);
          }}
          onCancel={onClose}
          confirmText={
            <TranslatedText
              stringId="program.action.sendToPatientPortal"
              fallback="Send to patient portal"
            />
          }
        />
      </ModalGenericButtonRow>
    </Modal>
  );
};

export const SendFormToPortalButton = ({ disabled }) => {
  const [open, setOpen] = useState(false);
  const patient = useSelector(state => state.patient);

  return (
    <>
      <TextButton
        onClick={() => setOpen(true)}
        style={{ textTransform: 'none' }}
        disabled={disabled}
      >
        <SendIcon width={12} height={12} style={{ marginRight: '0.25rem' }} />
        <TranslatedText
          stringId="program.action.sendToPatientPortal"
          fallback="Send to patient portal"
        />
      </TextButton>
      <SendFormToPortalModal open={open} onClose={() => setOpen(false)} patient={patient} />
    </>
  );
};
