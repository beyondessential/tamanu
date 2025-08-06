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

export const SendFormToPatientPortalModal = ({ disabled, formId, buttonText }) => {
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

  const handleSubmit = useCallback(
    async ({ email }) => {
      sendPatientPortalForm({
        patientId: patient.id,
        formId,
        assignedAt: getCurrentDateTimeString(),
        email,
      });
    },
    [sendPatientPortalForm, patient.id, formId],
  );

  return (
    <>
      <TextButton
        onClick={() => setOpen(true)}
        style={{ textTransform: 'none' }}
        disabled={disabled}
      >
        <SendIcon width={12} height={12} style={{ marginRight: '0.25rem' }} />
        {buttonText}
      </TextButton>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={
          <TranslatedText
            stringId="program.action.sendToPatientPortal"
            fallback="Send to patient portal"
          />
        }
      >
        <EmailAddressConfirmationForm
          onCancel={() => setOpen(false)}
          onSubmit={handleSubmit}
          renderButtons={submitForm => (
            <ModalGenericButtonRow>
              <FormSubmitCancelRow
                onConfirm={submitForm}
                onCancel={() => setOpen(false)}
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
    </>
  );
};
