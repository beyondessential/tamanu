import { Typography } from '@material-ui/core';
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import styled from 'styled-components';

import { Alert, FormSubmitCancelRow, TextButton, TranslatedText } from '@tamanu/ui-components';
import { useRegisterPatientPortal, useRemovePatientPortalAccess } from '../../../api/mutations';
import { ConfirmModal } from '../../ConfirmModal';
import { EmailAddressConfirmationForm } from '../../../forms/EmailAddressConfirmationForm';
import { FormModal } from '../../FormModal';
import { ModalGenericButtonRow } from '../../ModalActionRow';

const Text = styled(Typography)`
  font-size: 14px;
  margin: 20px 0 10px;
`;

const SubText = styled(Typography)`
  font-weight: 500;
  margin: 10px 0 20px;
  font-size: 14px;
`;

const RemoveAccessButton = styled(TextButton)`
  margin-block-end: 10px;
`;

const RemoveAccessConfirmModal = ({ patient, open, onCancel, onRemoved }) => {
  const { mutate: removeAccess } = useRemovePatientPortalAccess(patient.id, {
    onSuccess: () => {
      toast.success(
        <TranslatedText
          stringId="patientDetails.resources.patientPortalRegistration.modal.remove.success"
          fallback="Patient portal access removed"
        />,
      );
      onRemoved();
    },
    onError: error => toast.error(error.message),
  });

  return (
    <ConfirmModal
      open={open}
      onCancel={onCancel}
      onConfirm={() => removeAccess()}
      title={
        <TranslatedText
          stringId="patientDetails.resources.patientPortalRegistration.modal.remove.title"
          fallback="Remove portal access"
        />
      }
      text={
        <TranslatedText
          stringId="patientDetails.resources.patientPortalRegistration.modal.remove.text"
          fallback="Remove this patient's access to the patient portal?"
        />
      }
      subText={
        <TranslatedText
          stringId="patientDetails.resources.patientPortalRegistration.modal.remove.subText"
          fallback="Signing in with :email will no longer show this patient. Send a new registration link to give access again."
          replacements={{ email: patient.portalUser.email }}
        />
      }
      confirmButtonText={
        <TranslatedText
          stringId="patientDetails.resources.patientPortalRegistration.modal.remove.confirm"
          fallback="Remove access"
        />
      }
    />
  );
};

export const SendToPatientModal = ({ patient }) => {
  const [open, setOpen] = useState(true);
  const [isConfirmingRemoval, setIsConfirmingRemoval] = useState(false);
  const isRegistered = patient?.portalUser?.status === 'registered';

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
    onError: error => {
      toast.error(error.message);
    },
  });

  const handleSubmit = async ({ email }) => {
    registerPatientPortal({ patientId: patient.id, email });
  };

  return (
    <>
      <FormModal
        title={
          <TranslatedText
            stringId="patientDetails.resources.patientPortalRegistration.modal.title"
            fallback="Patient Portal registration"
          />
        }
        open={open}
        onClose={onClose}
      >
        {isRegistered ? (
          <>
            <Alert>Patient has successfully registered for the patient portal</Alert>
            <Text>
              <TranslatedText
                stringId="patientDetails.resources.patientPortalRegistration.modal.registeredText"
                fallback="To resend Patient Portal registration link, enter the patient's email address below."
              />
            </Text>
          </>
        ) : (
          <Text>
            <TranslatedText
              stringId="patientDetails.resources.patientPortalRegistration.modal.text"
              fallback="Enter the patient's email address below to email the link to the Patient Portal registration."
            />
          </Text>
        )}

        {patient?.portalUser && (
          <RemoveAccessButton onClick={() => setIsConfirmingRemoval(true)}>
            <TranslatedText
              stringId="patientDetails.resources.patientPortalRegistration.modal.remove.action"
              fallback="Remove portal access"
            />
          </RemoveAccessButton>
        )}
        <SubText>
          <TranslatedText
            stringId="patientDetails.resources.patientPortalRegistration.modal.subText"
            fallback="The Patient Portal uses email for account authentication during the login process. Please ensure the patient has access to this email address in order to access the portal."
          />
        </SubText>
        <EmailAddressConfirmationForm
          onSubmit={handleSubmit}
          onCancel={onClose}
          defaultEmail={patient?.email}
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
      {patient?.portalUser && (
        <RemoveAccessConfirmModal
          patient={patient}
          open={open && isConfirmingRemoval}
          onCancel={() => setIsConfirmingRemoval(false)}
          onRemoved={onClose}
        />
      )}
    </>
  );
};
