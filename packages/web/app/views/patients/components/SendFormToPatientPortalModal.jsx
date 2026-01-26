import React from 'react';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { useParams } from 'react-router';
import {
  BodyText,
  FormSubmitCancelRow,
  Modal,
  ModalActionRow,
  ModalGenericButtonRow,
  TranslatedText,
  useDateTimeFormat,
} from '../../../components';
import { useSendPatientPortalForm } from '../../../api/mutations/useSendPatientFormMutation';
import { EmailAddressConfirmationForm } from '../../../forms/EmailAddressConfirmationForm';
import { usePatientPortalSurveyAssignments, usePatientDataQuery } from '../../../api/queries';

const RegisterAndSendFormModal = ({ onSubmit, open, onClose }) => (
  <Modal
    open={open}
    onClose={onClose}
    title={
      <TranslatedText
        stringId="patientDetails.resources.patientPortalRegistration.modal.title"
        fallback="Patient Portal registration"
      />
    }
  >
    <ModalBody>
      <BodyText>
        <TranslatedText
          stringId="program.modal.registerSend.description"
          fallback="This patient has not yet registered for the patient portal. Patient portal registration must be completed in order for the patient to access this form. "
        />
      </BodyText>
      <br />
      <strong>
        <BodyText>
          <TranslatedText
            stringId="program.modal.registerSend.description2"
            fallback="The Patient Portal uses email for account authentication during the login process. Please ensure the patient has access to this email address in order to access the portal."
          />
        </BodyText>
      </strong>
    </ModalBody>
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
  padding-bottom: 24px;
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
        <TranslatedText
          stringId="program.modal.sendToPatientPortal.notAssigned.description"
          fallback="This form will be sent to the patient's portal. Ensure the patient has portal access so they can complete the form once received."
        />
      </BodyText>
    </ModalBody>
    <ModalActionRow
      onCancel={onClose}
      onConfirm={onSubmit}
      confirmText={
        <TranslatedText
          stringId="program.action.sendToPatientPortal"
          fallback="Send to patient portal"
        />
      }
    />
  </Modal>
);

const AlreadyAssignedModal = ({ open, onClose, onSubmit }) => (
  <Modal
    open={open}
    onClose={onClose}
    title={
      <TranslatedText
        stringId="program.modal.existingFormRequestPending.title"
        fallback="Existing form request pending"
      />
    }
  >
    <ModalBody>
      <BodyText>
        <TranslatedText
          stringId="program.modal.existingFormRequestPending.warning"
          fallback="The selected form has already been sent to this patient and is pending completion. A new request to complete this form can't be sent until the pending form is completed."
        />
      </BodyText>
      <br />
      <BodyText>
        <TranslatedText
          stringId="program.modal.sendToPatientPortal.alreadyAssigned.description"
          fallback="Would you like to send a reminder to complete the outstanding form? "
        />
      </BodyText>
    </ModalBody>
    <ModalActionRow
      onCancel={onClose}
      onConfirm={onSubmit}
      confirmText={
        <TranslatedText stringId="program.action.sendReminder" fallback="Send reminder" />
      }
    />
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
  const { getCurrentDateTimeString } = useDateTimeFormat();
  const isAssignedToSurvey = useIsAssignedToSurvey(patientId, formId);
  const isRegistered = Boolean(patient?.portalUser);

  const { mutate: sendPatientPortalForm } = useSendPatientPortalForm(patientId, {
    onSuccess: () => {
      toast.success('Form sent to patient portal');
      setOpen(false);
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  const handleSubmit = ({ email } = {}) => {
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
