import React from 'react';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { useParams } from 'react-router-dom';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import {
  BodyText,
  FormSubmitCancelRow,
  Modal,
  ModalActionRow,
  ModalGenericButtonRow,
  TranslatedText,
} from '../../../components';
import { useSendPatientPortalForm } from '../../../api/mutations/useSendPatientFormMutation';
import { EmailAddressConfirmationForm } from '../../../forms/EmailAddressConfirmationForm';
import { usePatientPortalSurveyAssignments } from '../../../api/queries';
import { usePatientDataQuery } from '../../../api/queries/usePatientDataQuery';

const RegisterAndSendFormModal = ({ onSubmit, open, onClose }) => (
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
      onSubmit={onSubmit}
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

const ModalBody = styled.div`
  padding-top: 16px;
  padding-bottom: 16px;
`;

const SendFormModal = ({ open, onClose, onSubmit }) => (
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
    <ModalBody>
      <BodyText>
        This form will be sent to the patient&apos;s portal. Ensure the patient has portal access so
        they can complete the form once received.
      </BodyText>
    </ModalBody>
    <ModalActionRow onCancel={onClose} onConfirm={onSubmit} confirmText="Send to patient portal" />
  </Modal>
);

const AlreadyAssignedModal = ({ open, onClose, onSubmit }) => (
  <Modal
    open={open}
    onClose={onClose}
    title={
      <TranslatedText
        stringId="program.action.sendToPatientPortal"
        fallback="Existing form request pending"
      />
    }
  >
    <ModalBody>
      <BodyText>
        This form has already been sent to the patient portal and a response is pending. Are you
        sure you would like to send it again?{' '}
      </BodyText>
      <br />
      <BodyText>
        If so, please ensure the patient has portal access so they can complete the form once
        received.
      </BodyText>
    </ModalBody>
    <ModalActionRow onCancel={onClose} onConfirm={onSubmit} confirmText="Send to patient portal" />
  </Modal>
);

const useIsAssignedToSurvey = (patientId, surveyId) => {
  const { data } = usePatientPortalSurveyAssignments(patientId);
  if (!data) {
    return false;
  }
  const assignedSurveys = data?.data;
  return assignedSurveys?.some(assignment => assignment.survey.id === surveyId);
};

export const SendFormToPatientPortalModal = ({ open, setOpen, formId }) => {
  const { patientId } = useParams();
  const { data: patient } = usePatientDataQuery(patientId);
  const isAssignedToSurvey = useIsAssignedToSurvey(patientId, formId);
  const isRegistered = Boolean(patient?.patientUser);

  const { mutate: sendPatientPortalForm } = useSendPatientPortalForm(patientId, {
    onSuccess: () => {
      toast.success('Form sent to patient portal');
      setOpen(false);
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  const handleSubmit = ({ email }) => {
    sendPatientPortalForm({
      formId,
      assignedAt: getCurrentDateTimeString(),
      email,
    });
  };

  const onClose = () => setOpen(false);

  if (isAssignedToSurvey) {
    return <AlreadyAssignedModal open={open} onClose={onClose} onSubmit={handleSubmit} />;
  }

  if (isRegistered) {
    return <SendFormModal open={open} onClose={onClose} onSubmit={handleSubmit} />;
  }

  return <RegisterAndSendFormModal open={open} onClose={onClose} onSubmit={handleSubmit} />;
};
