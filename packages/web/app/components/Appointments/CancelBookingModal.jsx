import React from 'react';
import { BaseModal } from '../BaseModal';
import { TranslatedText } from '../Translation';
import { Box, styled } from '@mui/material';
import { Colors } from '../../constants';

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

const AppointmentDetailsDisplay = ({ appointment }) => {
  console.log(appointment);
  return (
    <AppointmentDetailsContainer>
      <AppointmentDetailsColumn sx={{ borderInlineEnd: `1px solid ${Colors.outline}` }}>
        <DetailDisplay label="Area" value={appointment?.locationGroup?.name} />
        <DetailDisplay label="Location" value={appointment?.location?.name} />
        <DetailDisplay label="Date" value={appointment?.startTime} />
      </AppointmentDetailsColumn>
      <AppointmentDetailsColumn>
        <DetailDisplay label="Patient" value={appointment?.patient?.fullName} />
        <DetailDisplay label="Type" value={appointment?.type} />
        <DetailDisplay label="Clinician" value={appointment?.clinician?.displayName} />
      </AppointmentDetailsColumn>
    </AppointmentDetailsContainer>
  );
};

export const CancelBookingModal = ({ appointment, open, onClose }) => {
  return (
    <BaseModal
      title={
        <TranslatedText
          stringId="scheduling.action.cancelLocationBooking"
          fallback="Cancel location booking"
        />
      }
      open={open}
      onClose={onClose}
    >
      <TranslatedText
        stringId="scheduling.modal.cancelLocationBooking.text"
        fallback="Are you sure you would like to cancel the below location booking?"
      />
      <AppointmentDetailsDisplay appointment={appointment} />
    </BaseModal>
  );
};
