import { Box, styled } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { toast } from 'react-toastify';

import { APPOINTMENT_STATUSES, OTHER_REFERENCE_TYPES } from '@tamanu/constants';
import { formatDateRange } from '@tamanu/shared/utils/dateTime';

import { useAppointmentMutation } from '../../api/mutations';
import { Colors } from '../../constants';
import { BaseModal } from '../BaseModal';
import { ConfirmCancelRow } from '../ButtonRow';
import { PatientNameDisplay } from '../PatientNameDisplay';
import { TranslatedReferenceData, TranslatedText } from '../Translation';

const FlexCol = styled(Box)`
  display: flex;
  flex-direction: column;
`;

const FlexRow = styled(Box)`
  display: flex;
  flex-direction: row;
`;

const Label = styled('span')`
  color: ${Colors.midText};
  font-weight: 400;
`;

const Value = styled('span')`
  font-weight: 500;
`;

const DetailDisplay = ({ label, value }) => (
  <FlexCol>
    <Label>{label}</Label>
    <Value>{value ?? '—'}</Value>
  </FlexCol>
);

const AppointmentDetailsContainer = styled(FlexRow)`
  font-size: 0.875rem;
  background-color: ${Colors.white};
  border: 1px solid ${Colors.outline};
  padding-block: 1.5rem;
`;

const AppointmentDetailsColumn = styled(FlexCol)`
  padding-inline: 1.5rem;
  gap: 1.25rem;
  width: 50%;
`;

const BottomModalContainer = styled(Box)`
  padding-block: 2rem;
  padding-inline: 2.5rem;
  border-block-start: max(0.0625rem, 1px) solid ${Colors.outline};
  background-color: ${Colors.background};
`;

const StyledConfirmCancelRow = styled(ConfirmCancelRow)`
  margin-block-start: 0;
`;

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
      <AppointmentDetailsColumn sx={{ borderInlineEnd: `1px solid ${Colors.outline}` }}>
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
      </AppointmentDetailsColumn>
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
              category="appointmentType"
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

export const CancelBookingModal = ({ appointment, open, onClose }) => {
  const queryClient = useQueryClient();

  const { mutateAsync: cancelBooking } = useAppointmentMutation(
    { isEdit: true },
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
      onError: error => {
        console.log(error);
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
            cancelBooking({ ...appointment, status: APPOINTMENT_STATUSES.CANCELLED })
          }
          onClose={onClose}
        />
      }
      open={open}
      onClose={onClose}
    >
      <FlexCol sx={{ gap: '1.75rem' }}>
        <TranslatedText
          stringId="locationBooking.modal.cancel.text"
          fallback="Are you sure you would like to cancel the below location booking?"
        />
        <AppointmentDetailsDisplay appointment={appointment} />
      </FlexCol>
    </BaseModal>
  );
};
