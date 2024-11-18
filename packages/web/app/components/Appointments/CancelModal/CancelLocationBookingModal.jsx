import React from 'react';
import { toast } from 'react-toastify';
import { BaseModal } from '../../BaseModal';
import { TranslatedReferenceData, TranslatedText } from '../../Translation';
import { APPOINTMENT_STATUSES, OTHER_REFERENCE_TYPES } from '@tamanu/constants';
import { PatientNameDisplay } from '../../PatientNameDisplay';
import { formatDateRange } from '../../../utils/dateTime';
import { useLocationBookingMutation } from '../../../api/mutations';
import { useQueryClient } from '@tanstack/react-query';
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
  const {
    locationGroup,
    location,
    patient,
    bookingType,
    clinician,
    startTime,
    endTime,
  } = appointment;

  return (
    <AppointmentDetailsContainer>
      <AppointmentDetailsColumnLeft>
        <DetailDisplay
          label={
            <TranslatedText
              stringId="general.localisedField.locationGroupId.label"
              fallback="Area"
            />
          }
          value={
            <TranslatedReferenceData
              fallback={location?.locationGroup?.name || locationGroup?.name}
              value={location?.locationGroup?.id || locationGroup?.id}
              category={OTHER_REFERENCE_TYPES.LOCATION_GROUP}
            />
          }
        />
        <DetailDisplay
          label={
            <TranslatedText
              stringId="general.localisedField.locationId.label"
              fallback="Location"
            />
          }
          value={
            <TranslatedReferenceData
              fallback={location?.name ?? '—'}
              value={location?.id}
              category={OTHER_REFERENCE_TYPES.LOCATION}
            />
          }
        />
        <DetailDisplay
          label={<TranslatedText stringId="general.date.label" fallback="Date" />}
          value={formatDateRange(startTime, endTime)}
        />
      </AppointmentDetailsColumnLeft>
      <AppointmentDetailsColumn>
        <DetailDisplay
          label={<TranslatedText stringId="general.patient.label" fallback="Patient" />}
          value={<PatientNameDisplay patient={patient} />}
        />
        <DetailDisplay
          label={<TranslatedText stringId="scheduling.bookingType.label" fallback="Booking type" />}
          value={
            <TranslatedReferenceData
              value={bookingType.id}
              fallback={bookingType.name}
              category="bookingType"
            />
          }
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
      </AppointmentDetailsColumn>
    </AppointmentDetailsContainer>
  );
};

const BottomModalContent = ({ cancelBooking, onClose }) => (
  <BottomModalContainer>
    <StyledConfirmCancelRow
      onConfirm={cancelBooking}
      onCancel={onClose}
      cancelText={<TranslatedText stringId="general.action.goBack" fallback="Go back" />}
      confirmText={
        <TranslatedText stringId="scheduling.action.cancelBooking" fallback="Cancel booking" />
      }
    />
  </BottomModalContainer>
);

export const CancelLocationBookingModal = ({ appointment, open, onClose }) => {
  const queryClient = useQueryClient();

  const { mutateAsync: updateBooking } = useLocationBookingMutation(
    { isEdit: true, skipConflictCheck: true },
    {
      onSuccess: () => {
        toast.success(
          <TranslatedText
            stringId="scheduling.success.cancelBooking"
            fallback="Booking cancelled successfully"
          />,
        );
        queryClient.invalidateQueries('appointments');
        onClose();
      },
      onError: () => {
        toast.error(
          <TranslatedText
            stringId="scheduling.error.cancelBooking"
            fallback="Error cancelling booking"
          />,
        );
      },
    },
  );

  return (
    <BaseModal
      title={
        <TranslatedText
          stringId="locationBooking.action.cancel"
          fallback="Cancel location booking"
        />
      }
      fixedBottomRow // Ensures that bottom modal content can place a border across entire modal
      bottomRowContent={
        <BottomModalContent
          cancelBooking={() =>
            updateBooking({ ...appointment, status: APPOINTMENT_STATUSES.CANCELLED })
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
          fallback="Are you sure you would like to cancel the below location booking?"
        />
        <AppointmentDetailsDisplay appointment={appointment} />
      </BodyContainer>
    </BaseModal>
  );
};
