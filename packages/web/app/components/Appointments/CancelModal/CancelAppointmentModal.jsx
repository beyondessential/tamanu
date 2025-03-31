import { useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import styled from 'styled-components';
import { parseISO } from 'date-fns';

import {
  APPOINTMENT_STATUSES,
  MODIFY_REPEATING_APPOINTMENT_MODE,
  OTHER_REFERENCE_TYPES,
} from '@tamanu/constants';

import { useAppointmentMutation } from '../../../api/mutations';
import { formatDateTimeRange, formatShort } from '../../../utils/dateTime';
import { BaseModal } from '../../BaseModal';
import { PatientNameDisplay } from '../../PatientNameDisplay';
import { TranslatedReferenceData, TranslatedText } from '../../Translation';
import {
  AppointmentDetailsColumn,
  AppointmentDetailsColumnLeft,
  AppointmentDetailsContainer,
  BodyContainer,
  BottomModalContainer,
  DetailDisplay,
  StyledConfirmCancelRow,
  OptionsContainer,
} from './BaseModalComponents';
import { BodyText } from '../../Typography';
import { RepeatCharacteristicsDescription } from '../OutpatientsBookingForm/RepeatCharacteristicsDescription';
import { ModifyModeRadioGroup } from '../ModifyModeRadioGroup';

const StyledBodyText = styled(BodyText)`
  margin-bottom: 20px;
`;

const AppointmentDetailsDisplay = ({ appointment }) => {
  const {
    patient,
    startTime,
    endTime,
    locationGroup,
    clinician,
    appointmentType,
    schedule = {},
  } = appointment;

  return (
    <AppointmentDetailsContainer>
      <AppointmentDetailsColumnLeft>
        <DetailDisplay
          label={<TranslatedText
            stringId="general.patient.label"
            fallback="Patient"
            data-test-id='translatedtext-8mna' />}
          value={<PatientNameDisplay patient={patient} />}
        />
        <DetailDisplay
          label={<TranslatedText
            stringId="general.date.label"
            fallback="Date"
            data-test-id='translatedtext-gqxh' />}
          value={formatDateTimeRange(startTime, endTime)}
        />
        <DetailDisplay
          label={
            <TranslatedText
              stringId="general.localisedField.locationGroupId.label"
              fallback="Area"
              data-test-id='translatedtext-13ud' />
          }
          value={
            <TranslatedReferenceData
              fallback={locationGroup?.name}
              value={locationGroup?.id}
              category={OTHER_REFERENCE_TYPES.LOCATION_GROUP}
              data-test-id='translatedreferencedata-w370' />
          }
        />
        {schedule.id && (
          <DetailDisplay
            label={<TranslatedText
              stringId="appointment.repeating.label"
              fallback="Repeating"
              data-test-id='translatedtext-71v7' />}
            value={
              <RepeatCharacteristicsDescription
                startTimeDate={parseISO(startTime)}
                frequency={schedule.frequency}
                interval={schedule.interval}
              />
            }
          />
        )}
      </AppointmentDetailsColumnLeft>
      <AppointmentDetailsColumn>
        <DetailDisplay
          label={<TranslatedText
            stringId="general.patientId.label"
            fallback="Patient ID"
            data-test-id='translatedtext-zd1p' />}
          value={patient?.displayId}
        />
        <DetailDisplay
          label={
            <TranslatedText
              stringId="general.localisedField.clinician.label"
              fallback="Clinician"
              data-test-id='translatedtext-0qrl' />
          }
          value={clinician?.displayName}
        />
        <DetailDisplay
          label={
            <TranslatedText
              stringId="appointment.appointmentType.label.short"
              fallback="Appt type"
              data-test-id='translatedtext-nkd8' />
          }
          value={
            <TranslatedReferenceData
              value={appointmentType?.id}
              fallback={appointmentType?.name}
              category="appointmentType"
              data-test-id='translatedreferencedata-qhon' />
          }
        />
        {schedule.id && (
          <DetailDisplay
            label={<TranslatedText
              stringId="appointment.duration.label"
              fallback="Duration"
              data-test-id='translatedtext-p8ly' />}
            value={
              schedule.untilDate ? (
                <TranslatedText
                  stringId="appointment.duration.endsOnDate"
                  fallback="Ends on :date"
                  replacements={{ date: formatShort(schedule.untilDate) }}
                  data-test-id='translatedtext-d1lf' />
              ) : (
                <TranslatedText
                  stringId="appointment.duration.endsAfterOccurrences"
                  fallback="Ends after :numberOfOccurrences occurrences"
                  replacements={{ numberOfOccurrences: schedule.occurrenceCount }}
                  data-test-id='translatedtext-df64' />
              )
            }
          />
        )}
      </AppointmentDetailsColumn>
    </AppointmentDetailsContainer>
  );
};

const RepeatingAppointmentOptions = ({ deletionType, setDeletionType }) => {
  return (
    <OptionsContainer>
      <StyledBodyText>
        <TranslatedText
          stringId="appointment.cancelRepeating.message"
          fallback="This is a repeating appointment. Would you like to cancel this appointment only or this
        appointment and all future appointments as well?"
          data-test-id='translatedtext-42if' />
      </StyledBodyText>
      <ModifyModeRadioGroup
        onChange={event => setDeletionType(event.target.value)}
        value={deletionType}
      />
    </OptionsContainer>
  );
};

const BottomModalContent = ({ cancelBooking, onClose }) => (
  <BottomModalContainer>
    <StyledConfirmCancelRow
      confirmText={<TranslatedText
        stringId="general.action.confirm"
        fallback="Confirm"
        data-test-id='translatedtext-3znv' />}
      cancelText={<TranslatedText
        stringId="general.action.goBack"
        fallback="Go back"
        data-test-id='translatedtext-14k4' />}
      onConfirm={cancelBooking}
      onCancel={onClose}
    />
  </BottomModalContainer>
);

export const CancelAppointmentModal = ({ open, onClose, appointment }) => {
  const queryClient = useQueryClient();

  const [deletionType, setDeletionType] = useState(
    MODIFY_REPEATING_APPOINTMENT_MODE.THIS_APPOINTMENT,
  );

  const handleCloseModal = () => {
    setDeletionType(MODIFY_REPEATING_APPOINTMENT_MODE.THIS_APPOINTMENT);
    onClose();
  };

  const { mutateAsync: mutateAppointment } = useAppointmentMutation(appointment.id, {
    onSuccess: () => {
      if (deletionType === MODIFY_REPEATING_APPOINTMENT_MODE.THIS_APPOINTMENT) {
        toast.success(
          <TranslatedText
            stringId="appointment.success.cancelAppointment"
            fallback="Appointment cancelled successfully"
            data-test-id='translatedtext-dfx2' />,
        );
      }
      if (deletionType === MODIFY_REPEATING_APPOINTMENT_MODE.THIS_AND_FUTURE_APPOINTMENTS) {
        toast.success(
          <TranslatedText
            stringId="appointment.success.cancelRepeatingAppointment"
            fallback="This and future appointments cancelled successfully"
            data-test-id='translatedtext-znm2' />,
        );
      }
      queryClient.invalidateQueries('appointments');
      handleCloseModal();
    },
    onError: () => {
      toast.error(
        <TranslatedText
          stringId="appointment.error.cancelAppointment"
          fallback="Error cancelling appointment"
          data-test-id='translatedtext-f1jf' />,
      );
    },
  });

  return (
    <BaseModal
      title={<TranslatedText
        stringId="appointment.action.cancel"
        fallback="Cancel appointment"
        data-test-id='translatedtext-gsba' />}
      fixedBottomRow // Ensures that bottom modal content can place a border across entire modal
      bottomRowContent={
        <BottomModalContent
          cancelBooking={() => {
            mutateAppointment({
              ...appointment,
              status: APPOINTMENT_STATUSES.CANCELLED,
              modifyMode: deletionType,
            });
          }}
          onClose={handleCloseModal}
        />
      }
      open={open}
      onClose={handleCloseModal}
      width="md"
    >
      <BodyContainer>
        <TranslatedText
          stringId="locationBooking.modal.cancel.text"
          fallback="Are you sure you would like to cancel the below appointment?"
          data-test-id='translatedtext-i5yy' />
        <AppointmentDetailsDisplay appointment={appointment} />
        {appointment.schedule && (
          <RepeatingAppointmentOptions
            deletionType={deletionType}
            setDeletionType={setDeletionType}
          />
        )}
      </BodyContainer>
    </BaseModal>
  );
};
