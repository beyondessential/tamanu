import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { EmailAddressConfirmationForm } from '../../../forms/EmailAddressConfirmationForm';
import { TranslatedText } from '../../Translation';
import { FormModal } from '../../FormModal';
import { ModalGenericButtonRow } from '../../ModalActionRow';
import { FormSubmitCancelRow } from '../../ButtonRow';
import { useRegisterPatientPortal } from '../../../api/mutations';

export const SendToPatientModal = ({ patient }) => {
  const [open, setOpen] = useState(true);

  const onClose = () => setOpen(false);

  const { mutate: registerPatientPortal } = useRegisterPatientPortal({
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

  const handleSubmit = async ({ email }) => {
    registerPatientPortal({ patientId: patient.id, email });
  };

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
};
