import React, { useState } from 'react';
import { toast } from 'react-toastify';
import styled from 'styled-components';
import { Typography } from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { EmailAddressConfirmationForm } from '../../../forms/EmailAddressConfirmationForm';
import { TranslatedText } from '../../Translation';
import { FormModal } from '../../FormModal';
import { ModalGenericButtonRow } from '../../ModalActionRow';
import { FormSubmitCancelRow } from '../../ButtonRow';
import { useRegisterPatientPortal } from '../../../api/mutations';
import { Colors } from '../../../constants';

const Text = styled(Typography)`
  font-size: 14px;
  margin: 20px 0 10px;
`;

const SubText = styled(Typography)`
  font-weight: 500;
  margin: 10px 0 20px;
  font-size: 14px;
`;

const StyledAlert = styled(Alert)`
  background-color: ${({ theme }) => theme.palette.background.paper};
  border: 1px solid ${Colors.outline};
  font-size: 14px;
  color: ${props => props.theme.palette.text.primary};
`;

export const SendToPatientModal = ({ patient }) => {
  const [open, setOpen] = useState(true);
  console.log('patient', patient);
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
  });

  const handleSubmit = async ({ email }) => {
    registerPatientPortal({ patientId: patient.id, email });
  };

  return (
    <FormModal
      title={
        <TranslatedText
          stringId="patientDetails.resources.patientPortalRegistration.modal.title"
          fallback="Patient Portal registration"
          data-testid="translatedtext-patient-portal-title"
        />
      }
      open={open}
      onClose={onClose}
    >
      {isRegistered ? (
        <>
          <StyledAlert variant="outlined" severity="success">
            Patient has successfully registered for the patient portal
          </StyledAlert>
          <Text>
            <TranslatedText
              stringId="patientDetails.resources.patientPortalRegistration.modal.registeredText"
              fallback="To resend Patient Portal registration link, enter the patients email address below."
            />
          </Text>
        </>
      ) : (
        <Text>
          <TranslatedText
            stringId="patientDetails.resources.patientPortalRegistration.modal.text"
            fallback="Enter the patients email address below to email the link to the Patient Portal registration."
          />
        </Text>
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
