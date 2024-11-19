import React from 'react';
import { styled } from '@mui/material/styles';
import Overnight from '@mui/icons-material/Brightness2';
import { PriorityHigh as HighPriorityIcon } from '@material-ui/icons';

import { Colors } from '../../../constants';
import { TranslatedReferenceData, TranslatedText } from '../../Translation';
import { formatDateRange } from '../../../utils/dateTime';
import { DetailsDisplay, FlexCol, FlexRow } from './SharedComponents';

const AppointmentDetailsContainer = styled(FlexCol)`
  gap: 0.5rem;
  border-block: max(0.0625rem, 1px) solid ${Colors.outline};
  position: relative;
`;

const Tag = styled(FlexRow)`
  gap: 0.125rem;
  position: absolute;
  inset-inline-end: 0.75rem;
  inset-block-end: 0.75rem;
`;

const LocationBookingDetails = ({ location, bookingType, isOvernight }) => {
  return (
    <>
      {location && (
        <DetailsDisplay
          label={
            <TranslatedText
              stringId="general.localisedField.locationId.label"
              fallback="Location"
            />
          }
          value={
            <TranslatedReferenceData
              fallback={location?.name}
              value={location?.id}
              category="location"
            />
          }
        />
      )}
      {bookingType && (
        <DetailsDisplay
          label={<TranslatedText stringId="scheduling.bookingType.label" fallback="Booking type" />}
          value={
            <TranslatedReferenceData
              value={bookingType.id}
              fallback={bookingType.name}
              category="bookingType"
            />
          }
        />
      )}
      {isOvernight && (
        <Tag>
          <Overnight htmlColor={Colors.primary} sx={{ fontSize: 15 }} />
          <TranslatedText stringId="scheduling.bookingType.overnight" fallback="Overnight" />
        </Tag>
      )}
    </>
  );
};

const AppointmentTypeDetails = ({ appointmentType, isHighPriority }) => {
  return (
    <>
      {appointmentType && (
        <DetailsDisplay
          label={
            <TranslatedText
              stringId="appointment.appointmentType.label.short"
              fallback="Appt type"
            />
          }
          value={
            <TranslatedReferenceData
              value={appointmentType.id}
              fallback={appointmentType.name}
              category="appointmentType"
            />
          }
        />
      )}
      {isHighPriority && (
        <Tag>
          <HighPriorityIcon
            aria-label="High priority"
            htmlColor={Colors.alert}
            style={{ fontSize: 15 }}
          />
          <TranslatedText stringId="general.highPriority.label" fallback="High priority" />
        </Tag>
      )}
    </>
  );
};

export const AppointmentDetailsDisplay = ({ appointment, isOvernight }) => {
  const {
    startTime,
    endTime,
    clinician,
    locationGroup,
    location,
    bookingType,
    appointmentType,
    isHighPriority,
  } = appointment;
  return (
    <AppointmentDetailsContainer>
      <DetailsDisplay
        label={<TranslatedText stringId="general.time.label" fallback="Time" />}
        value={formatDateRange(startTime, endTime, isOvernight)}
      />
      <DetailsDisplay
        label={
          <TranslatedText
            stringId="general.localisedField.clinician.label.short"
            fallback="Clinician"
          />
        }
        value={clinician?.displayName}
      />
      <DetailsDisplay
        label={
          <TranslatedText stringId="general.localisedField.locationGroupId.label" fallback="Area" />
        }
        value={
          <TranslatedReferenceData
            fallback={location?.locationGroup?.name || locationGroup?.name}
            value={location?.locationGroup?.id || locationGroup?.id}
            category="locationGroup"
          />
        }
      />

      {/* Location booking specific data */}
      {location && bookingType && (
        <LocationBookingDetails
          location={location}
          bookingType={bookingType}
          isOvernight={isOvernight}
        />
      )}

      {/* Outpatient appointment specific data */}
      {appointmentType && (
        <AppointmentTypeDetails appointmentType={appointmentType} isHighPriority={isHighPriority} />
      )}
    </AppointmentDetailsContainer>
  );
};
