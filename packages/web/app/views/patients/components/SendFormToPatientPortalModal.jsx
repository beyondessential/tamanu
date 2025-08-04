import React, { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import {
  FormSubmitCancelRow,
  Modal,
  ModalGenericButtonRow,
  TranslatedText,
  TextButton,
} from '../../../components';
import { SendIcon } from '../../../components/Icons/SendIcon';
import { useSendPatientPortalForm } from '../../../api/mutations/useSendPatientFormMutation';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { EmailAddressConfirmationForm } from '../../../forms/EmailAddressConfirmationForm';

export const SendFormToPatientPortalModal = ({ open, onClose, onSendToPatientPortal }) => {
  const handleSubmit = useCallback(
    async ({ email }) => {
      await onSendToPatientPortal(email);
    },
    [onSendToPatientPortal],
  );

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
      <EmailAddressConfirmationForm
        onCancel={onClose}
        onSubmit={handleSubmit}
        renderButtons={submitForm => (
          <ModalGenericButtonRow>
            <FormSubmitCancelRow
              onConfirm={submitForm}
              onCancel={onClose}
              confirmText={
                <TranslatedText
                  stringId="program.action.sendToPatientPortal"
                  fallback="Send to patient portal"
                />
              }
            />
          </ModalGenericButtonRow>
        )}
      />
    </Modal>
  );
};

export const SendFormToPatientPortalButton = ({ disabled, formId }) => {
  const [open, setOpen] = useState(false);
  const patient = useSelector(state => state.patient);

  const { mutate: sendPatientPortalForm } = useSendPatientPortalForm({
    onSuccess: () => {
      toast.success('Form sent to patient portal');
      setOpen(false);
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  const handleSendToPatientPortal = email => {
    sendPatientPortalForm({
      patientId: patient.id,
      formId,
      assignedAt: getCurrentDateTimeString(),
      email,
    });
  };

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
      <SendFormToPatientPortalModal
        open={open}
        onClose={() => setOpen(false)}
        onSendToPatientPortal={handleSendToPatientPortal}
      />
    </>
  );
};
