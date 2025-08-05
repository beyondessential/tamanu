import React, { useEffect, useState } from 'react';
import { styled } from '@mui/material/styles';
import { Box, Link } from '@mui/material';
import QRCode from 'qrcode';
import { useSelector } from 'react-redux';

import { Modal } from '../../Modal';
import { TranslatedText } from '../../Translation/TranslatedText';
import { BodyText } from '../../Typography';
import { Button, OutlinedButton } from '../..';
import { Colors } from '../../../constants';
import { SendIcon } from '../../Icons/SendIcon';
import { useRegisterPatientPortal } from '../../../api/mutations/useRegisterPatientPortalMutation';
import { SendToPatientModal } from './SendToPatientModal';

const StyledButtonRow = styled(`div`)`
  display: flex;
  align-items: center;
  padding-inline: 1.75rem;
  padding-block: 1.25rem;
  gap: 1rem;
  background-color: ${Colors.background};
  border-top: 1px solid ${Colors.outline};
`;

const StyledQrCodeContainer = styled(Box)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.25rem;
`;

const StyledWarningContainer = styled(`div`)`
  font-weight: bold;
  margin-top: 1.25rem;
  display: block;
`;

const generateQrCode = registrationLink => {
  return QRCode.toDataURL(registrationLink);
};

const BottomRow = ({ onPrint, onSendToPatient, onClose }) => (
  <StyledButtonRow>
    <OutlinedButton onClick={onPrint}>
      <TranslatedText
        stringId="general.action.print"
        fallback="Print"
        data-testid="translatedtext-patient-portal-print"
      />
    </OutlinedButton>
    <OutlinedButton
      startIcon={<SendIcon htmlColor={Colors.primary} width={16} height={16} />}
      style={{ marginLeft: 'auto' }}
      onClick={onSendToPatient}
    >
      <TranslatedText
        stringId="patientDetails.resources.patientPortalRegistration.modal.action.sendToPatient"
        fallback="Send to patient"
        data-testid="translatedtext-patient-portal-send-to-patient"
      />
    </OutlinedButton>
    <Button onClick={onClose}>
      <TranslatedText
        stringId="general.action.close"
        fallback="Close"
        data-testid="translatedtext-patient-portal-close"
      />
    </Button>
  </StyledButtonRow>
);

const QrCodeDisplay = ({ qrCode, registrationLink }) => {
  if (!qrCode || !registrationLink) {
    return null;
  }

  return (
    <StyledQrCodeContainer>
      <img src={qrCode} alt="Patient portal registration QR code" style={{ width: '11.5rem' }} />
      <Link href={registrationLink} target="_blank">
        {registrationLink}
      </Link>
    </StyledQrCodeContainer>
  );
};

export const PatientPortalRegistrationModal = React.memo(() => {
  const patient = useSelector(state => state.patient);

  const [open, setOpen] = useState(true);
  const [openSendToPatientModal, setOpenSendToPatientModal] = useState(false);
  const [registrationLink, setRegistrationLink] = useState(null);
  const [qrCode, setQrCode] = useState(null);

  const { mutate: registerPatientPortal } = useRegisterPatientPortal({
    onSuccess: data => {
      setRegistrationLink(data?.registrationLink);
      generateQrCode(data?.registrationLink).then(setQrCode);
    },
  });

  // Automatically register the patient when this modal is opened
  useEffect(() => {
    if (patient?.id) {
      registerPatientPortal({ patientId: patient.id });
    }
  }, [patient?.id, registerPatientPortal]);

  if (openSendToPatientModal) {
    return (
      <SendToPatientModal
        open={openSendToPatientModal}
        onClose={() => setOpenSendToPatientModal(false)}
        patient={patient}
      />
    );
  }

  return (
    <Modal
      title={
        <TranslatedText
          stringId="patientDetails.resources.patientPortalRegistration.modal.title"
          fallback="Patient Portal Registration"
          data-testid="translatedtext-patient-portal-title"
        />
      }
      open={open}
      onClose={() => setOpen(false)}
      width="md"
      data-testid="modal-patient-portal-registration"
      fixedBottomRow
      bottomRowContent={
        <BottomRow
          onPrint={() => {}}
          onSendToPatient={() => setOpenSendToPatientModal(true)}
          onClose={() => setOpen(false)}
        />
      }
    >
      <BodyText style={{ marginBottom: '1.25rem' }}>
        <TranslatedText
          stringId="patientDetails.resources.patientPortalRegistration.modal.instructionsMessage"
          fallback="Please ask the patient to scan the QR code using their camera app and follow the prompts to create a Tamanu patient portal account. "
          data-testid="translatedtext-patient-portal-instructions-message"
        />
        <StyledWarningContainer>
          <TranslatedText
            stringId="patientDetails.resources.patientPortalRegistration.modal.whatsAppMessage"
            fallback="The Patient Portal uses WhatsApp for multi-factor authentication. Please ensure the patient has an active WhatsApp account in order to access the portal."
            data-testid="translatedtext-patient-portal-whatsapp-message"
          />
        </StyledWarningContainer>
      </BodyText>
      <QrCodeDisplay qrCode={qrCode} registrationLink={registrationLink} />
    </Modal>
  );
});
