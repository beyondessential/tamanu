import { useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { toast } from 'react-toastify';

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

const AppointmentDetailsDisplay = ({ appointment }) => {
  const { patient, startTime, endTime, locationGroup, clinician, appointmentType } = appointment;

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
      </AppointmentDetailsColumn>
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

  const { mutateAsync: mutateAppointment } = useAppointmentMutation(
    { isEdit: true },
    {
      onSuccess: () => {
        toast.success(
          <TranslatedText
            stringId="appointment.success.cancelAppointment"
            fallback="Appointment cancelled successfully"
          />,
        );
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
    },
  );

  return (
    <BaseModal
      title={<TranslatedText stringId="appointment.action.cancel" fallback="Cancel appointment" />}
      fixedBottomRow // Ensures that bottom modal content can place a border across entire modal
      bottomRowContent={
        <BottomModalContent
          cancelBooking={() =>
            mutateAppointment({ ...appointment, status: APPOINTMENT_STATUSES.CANCELLED })
          }
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
      </BodyContainer>
    </BaseModal>
  );
};
