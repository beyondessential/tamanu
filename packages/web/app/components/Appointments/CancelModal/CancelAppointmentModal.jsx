import { useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { omit } from 'lodash';

import { APPOINTMENT_STATUSES, OTHER_REFERENCE_TYPES } from '@tamanu/constants';

import { useAppointmentMutation } from '../../../api/mutations';
import { formatDateTimeRange } from '../../../utils/dateTime';
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
} from './BaseModalComponents';
import { RadioInput } from '../../Field';
import { BodyText } from '../../Typography';

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
          label={<TranslatedText stringId="general.patient.label" fallback="Patient" />}
          value={<PatientNameDisplay patient={patient} />}
        />
        <DetailDisplay
          label={<TranslatedText stringId="general.date.label" fallback="Date" />}
          value={formatDateTimeRange(startTime, endTime)}
        />
        <DetailDisplay
          label={
            <TranslatedText
              stringId="general.localisedField.locationGroupId.label"
              fallback="Area"
            />
          }
          value={
            <TranslatedReferenceData
              fallback={locationGroup?.name}
              value={locationGroup?.id}
              category={OTHER_REFERENCE_TYPES.LOCATION_GROUP}
            />
          }
        />
        {schedule.id && (
          <DetailDisplay
            label={<TranslatedText stringId="appointment.repeating.label" fallback="Repeating" />}
            // TODO: translations + formatting + all variations
            value={`${schedule.frequency} on ${schedule.daysOfWeek}`}
          />
        )}
      </AppointmentDetailsColumnLeft>
      <AppointmentDetailsColumn>
        <DetailDisplay
          label={<TranslatedText stringId="general.patientId.label" fallback="Patient ID" />}
          value={patient?.displayId}
        />
        <DetailDisplay
          label={
            <TranslatedText
              stringId="general.localisedField.clinician.label"
              fallback="Clinician"
            />
          }
          value={clinician?.displayName}
        />
        <DetailDisplay
          label={
            <TranslatedText
              stringId="appointment.appointmentType.label.short"
              fallback="Appt type"
            />
          }
          value={
            <TranslatedReferenceData
              value={appointmentType?.id}
              fallback={appointmentType?.name}
              category="appointmentType"
            />
          }
        />
        {schedule.id && (
          <DetailDisplay
            label={<TranslatedText stringId="appointment.duration.label" fallback="Duration" />}
            // TODO: translations + formatting + all variations
            value={`Ends on ${schedule.untilDate}`}
          />
        )}
      </AppointmentDetailsColumn>
    </AppointmentDetailsContainer>
  );
};

export const CANCEL_REPEATING_APPOINTMENT_MODE = {
  THIS_APPOINTMENT: 'thisAppointment',
  THIS_AND_FUTURE_APPOINTMENTS: 'thisAndFutureAppointments',
};

const RepeatingAppointmentOptions = ({ deletionType, setDeletionType }) => {
  return (
    <AppointmentDetailsContainer>
      <BodyText>
        This is a repeating appointment. Would you like to cancel this appointment only or this
        appointment and all future appointments as well?
      </BodyText>
      <RadioInput
        value={deletionType}
        onChange={e => setDeletionType(e.target.value)}
        options={[
          { label: 'This appointment', value: CANCEL_REPEATING_APPOINTMENT_MODE.THIS_APPOINTMENT },
          {
            label: 'This and future appointments',
            value: CANCEL_REPEATING_APPOINTMENT_MODE.THIS_AND_FUTURE_APPOINTMENTS,
          },
        ]}
      />
    </AppointmentDetailsContainer>
  );
};

const BottomModalContent = ({ cancelBooking, onClose }) => (
  <BottomModalContainer>
    <StyledConfirmCancelRow
      confirmText={<TranslatedText stringId="general.action.confirm" fallback="Confirm" />}
      cancelText={<TranslatedText stringId="general.action.goBack" fallback="Go back" />}
      onConfirm={cancelBooking}
      onCancel={onClose}
    />
  </BottomModalContainer>
);

export const CancelAppointmentModal = ({ open, onClose, appointment }) => {
  const queryClient = useQueryClient();

  const [deletionType, setDeletionType] = useState(
    CANCEL_REPEATING_APPOINTMENT_MODE.THIS_APPOINTMENT,
  );

  const { mutateAsync: mutateAppointment } = useAppointmentMutation(appointment.id, {
    onSuccess: () => {
      if (deletionType === CANCEL_REPEATING_APPOINTMENT_MODE.THIS_APPOINTMENT) {
        toast.success(
          <TranslatedText
            stringId="appointment.success.cancelAppointment"
            fallback="Appointment cancelled successfully"
          />,
        );
      }
      if (deletionType === CANCEL_REPEATING_APPOINTMENT_MODE.THIS_AND_FUTURE_APPOINTMENTS) {
        toast.success(
          <TranslatedText
            stringId="appointment.success.cancelRepeatingAppointment"
            fallback="This and future appointments cancelled successfully"
          />,
        );
      }
      queryClient.invalidateQueries('appointments');
      onClose();
    },
    onError: () => {
      toast.error(
        <TranslatedText
          stringId="appointment.error.cancelAppointment"
          fallback="Error cancelling appointment"
        />,
      );
    },
  });

  return (
    <BaseModal
      title={<TranslatedText stringId="appointment.action.cancel" fallback="Cancel appointment" />}
      fixedBottomRow // Ensures that bottom modal content can place a border across entire modal
      bottomRowContent={
        <BottomModalContent
          cancelBooking={() => {
            if (deletionType === CANCEL_REPEATING_APPOINTMENT_MODE.THIS_APPOINTMENT) {
              mutateAppointment({
                ...omit(appointment, 'schedule', 'scheduleId'),
                status: APPOINTMENT_STATUSES.CANCELLED,
              });
            }
            if (deletionType === CANCEL_REPEATING_APPOINTMENT_MODE.THIS_AND_FUTURE_APPOINTMENTS) {
              mutateAppointment({ ...appointment, status: APPOINTMENT_STATUSES.CANCELLED });
            }
          }}
          onClose={onClose}
        />
      }
      open={open}
      onClose={onClose}
    >
      <BodyContainer>
        <TranslatedText
          stringId="locationBooking.modal.cancel.text"
          fallback="Are you sure you would like to cancel the below appointment?"
        />
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
