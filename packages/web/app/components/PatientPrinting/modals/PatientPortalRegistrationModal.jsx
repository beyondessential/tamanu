import React, { useState } from 'react';
import { styled } from '@mui/material/styles';
import { SendHorizontal } from 'lucide-react';

import { Modal } from '../../Modal';
import { TranslatedText } from '../../Translation/TranslatedText';
import { BodyText } from '../../Typography';
import { Button, OutlinedButton } from '../..';
import { Colors } from '../../../constants';

const StyledButtonRow = styled('div')`
  display: flex;
  align-items: center;
  padding-inline: 1.75rem;
  padding-block: 1.25rem;
  gap: 1rem;
  background-color: ${Colors.background};
  border-top: 1px solid ${Colors.outline};
`;

const BottomRow = ({ onPrint, onSendToPatient, onClose }) => (
  <StyledButtonRow>
    <OutlinedButton onClick={onPrint}>
      <TranslatedText
        stringId="general.action.print"
        fallback="Print"
        data-testid="translatedtext-patient-portal-print"
      />
    </OutlinedButton>
    <OutlinedButton style={{ marginLeft: 'auto' }} onClick={onSendToPatient}>
      <SendHorizontal size={16} fill={Colors.primary} />
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

export const PatientPortalRegistrationModal = React.memo(({ patient }) => {
  const [open, setOpen] = useState(true);

  console.log('patient', patient);

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
        <BottomRow onPrint={() => {}} onSendToPatient={() => {}} onClose={() => setOpen(false)} />
      }
    >
      <BodyText>
        <TranslatedText
          stringId="patientDetails.resources.patientPortalRegistration.modal.instructionsMessage"
          fallback="Please ask the patient to scan the QR code using their camera app and follow the prompts to create a Tamanu patient portal account. "
          data-testid="translatedtext-patient-portal-instructions-message"
        />
        <br />
        <br />
        <span style={{ fontWeight: 'bold' }}>
          <TranslatedText
            stringId="patientDetails.resources.patientPortalRegistration.modal.whatsAppMessage"
            fallback="The Patient Portal uses WhatsApp for multi-factor authentication. Please ensure the patient has an active WhatsApp account in order to access the portal."
            data-testid="translatedtext-patient-portal-whatsapp-message"
          />
        </span>
      </BodyText>
    </Modal>
  );
});
