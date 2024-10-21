import React, { useCallback } from 'react';
import { Box, styled } from '@mui/material';
import { toast } from 'react-toastify';

import { BaseModal } from '../BaseModal';
import { TranslatedEnum, TranslatedReferenceData, TranslatedText } from '../Translation';
import { Colors } from '../../constants';
import { ConfirmCancelRow } from '../ButtonRow';
import { useApi } from '../../api';
import {
  APPOINTMENT_STATUSES,
  APPOINTMENT_TYPE_LABELS,
  OTHER_REFERENCE_TYPES,
} from '@tamanu/constants';
import { formatDateRange } from './utils';
import { PatientNameDisplay } from '../PatientNameDisplay';

const FlexCol = styled(Box)`
  display: flex;
  flex-direction: column;
`;

const FlexRow = styled(Box)`
  display: flex;
  flex-direction: row;
`;

const Label = styled(`span`)`
  font-weight: 400;
  font-color: ${Colors.midText};
`;

const Value = styled(`span`)`
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
  border-block-start: 1px solid ${Colors.outline};
  background-color: ${Colors.background};
`;

const AppointmentDetailsDisplay = ({ appointment }) => {
  const { locationGroup, location, patient, type, clinician, startTime, endTime } = appointment;

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
              fallback={locationGroup?.name}
              value={locationGroup?.id}
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
            <TranslatedEnum value={type} enumValues={APPOINTMENT_TYPE_LABELS} enumFallback={type} />
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
    <ConfirmCancelRow
      style={{ marginTop: '0px' }}
      onConfirm={cancelBooking}
      onCancel={onClose}
      cancelText={<TranslatedText stringId="general.action.goBack" fallback="Go back" />}
      confirmText={
        <TranslatedText stringId="scheduling.action.cancelBooking" fallback="Cancel booking" />
      }
    />
  </BottomModalContainer>
);

export const CancelBookingModal = ({ appointment, open, onClose, onUpdated }) => {
  const api = useApi();

  const cancelBooking = useCallback(async () => {
    try {
      await api.put(`appointments/${appointment.id}`, {
        status: APPOINTMENT_STATUSES.CANCELLED,
      });
      onUpdated();
    } catch (error) {
      toast.error(
        <TranslatedText
          stringId="scheduling.error.cancelBooking"
          fallback="Error cancelling booking"
        />,
      );
    }
  }, [api, appointment.id, onUpdated]);

  return (
    <BaseModal
      title={
        <TranslatedText
          stringId="scheduling.action.cancelLocationBooking"
          fallback="Cancel location booking"
        />
      }
      fixedBottomRow // Ensures that bottom modal content can place a border across entire modal
      bottomRowContent={<BottomModalContent cancelBooking={cancelBooking} onClose={onClose} />}
      open={open}
      onClose={onClose}
    >
      <FlexCol sx={{ gap: '1.75rem' }}>
        <TranslatedText
          stringId="scheduling.modal.cancelLocationBooking.text"
          fallback="Are you sure you would like to cancel the below location booking?"
        />
        <AppointmentDetailsDisplay appointment={appointment} />
      </FlexCol>
    </BaseModal>
  );
};
