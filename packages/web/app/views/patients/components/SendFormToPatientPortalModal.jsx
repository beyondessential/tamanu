import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import {
  ConfirmCancelRow,
  Modal,
  ModalGenericButtonRow,
  TranslatedText,
  TextButton,
} from '../../../components';
import { SendIcon } from '../../../components/Icons/SendIcon';
import { useSendPatientPortalForm } from '../../../api/mutations/useSendPatientFormMutation';
import { usePatientSurveyAssignmentsQuery } from '../../../api/queries/usePatientSurveyAssignmentsQuery';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';

export const SendFormToPatientPortalModal = ({ open, onClose, onSendToPatientPortal }) => {
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
            onSendToPatientPortal();
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

export const SendFormToPatientPortalButton = ({ disabled, formId }) => {
  const [open, setOpen] = useState(false);
  const patient = useSelector(state => state.patient);
  const { data: duplicateSurveyAssignments } = usePatientSurveyAssignmentsQuery({
    patientId: patient.id,
    surveyId: formId,
    enabled: !!formId,
  });

  console.log('duplicateSurveyAssignments', duplicateSurveyAssignments);

  const { mutate: sendPatientPortalForm } = useSendPatientPortalForm({
    onSuccess: () => {
      toast.success('Form sent to patient portal');
    },
  });

  const handleSendToPatientPortal = () => {
    sendPatientPortalForm({
      patientId: patient.id,
      formId,
      assignedAt: getCurrentDateTimeString(),
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
