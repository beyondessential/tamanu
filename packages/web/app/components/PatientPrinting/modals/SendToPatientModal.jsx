import React, { useCallback } from 'react';
import { toast } from 'react-toastify';

import { useSendPatientPortalRegistrationEmail } from '../../../api/mutations/useSendPatientPortalRegistrationEmail';
import { EmailAddressConfirmationForm } from '../../../forms/EmailAddressConfirmationForm';
import { TranslatedText } from '../../Translation';
import { FormModal } from '../../FormModal';
import { ModalGenericButtonRow } from '../../ModalActionRow';
import { FormSubmitCancelRow } from '../../ButtonRow';

export const SendToPatientModal = React.memo(({ open, onClose, patient }) => {
  const { mutate: sendPatientPortalRegistrationEmail } = useSendPatientPortalRegistrationEmail({
    onSuccess: () => {
      toast.success(
        <TranslatedText
          stringId="patientDetails.resources.patientPortalRegistration.modal.sendToPatient.success"
          fallback="Patient portal link successfully sent to patient"
        />,
      );
      onClose();
    },
  });

  const handleSubmit = useCallback(
    async ({ email }) => {
      sendPatientPortalRegistrationEmail({ patientId: patient.id, email });
    },
    [patient.id, sendPatientPortalRegistrationEmail],
  );

  return (
    <FormModal
      title={
        <TranslatedText
          stringId="patientDetails.resources.patientPortalRegistration.modal.sendToPatient.title"
          fallback="Send to patient"
          data-testid="translatedtext-patient-portal-title"
        />
      }
      open={open}
      onClose={onClose}
    >
      <EmailAddressConfirmationForm
        onSubmit={handleSubmit}
        onCancel={onClose}
        renderButtons={submitForm => (
          <ModalGenericButtonRow>
            <FormSubmitCancelRow
              onConfirm={submitForm}
              onCancel={onClose}
              confirmText={<TranslatedText stringId="general.action.send" fallback="Send" />}
            />
          </ModalGenericButtonRow>
        )}
      />
    </FormModal>
  );
});
