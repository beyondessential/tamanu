import { PriorityHigh as HighPriorityIcon } from '@material-ui/icons';
import Overnight from '@mui/icons-material/Brightness2';
import { styled } from '@mui/material/styles';
import React from 'react';

import { Colors } from '../../../constants';
import { formatDateTimeRange } from '../../../utils/dateTime';
import { TranslatedReferenceData, TranslatedText } from '../../Translation';
import { DetailsDisplay } from './SharedComponents';

const AppointmentDetailsContainer = styled('div')`
  border-block: max(0.0625rem, 1px) solid ${Colors.outline};
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  position: relative;
`;

const Tag = styled('div')`
  display: flex;
  flex-direction: row;
  gap: 0.125rem;
  inset-block-end: 0.75rem;
  inset-inline-end: 0.75rem;
  position: absolute;
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
              data-testid='translatedtext-wm3s' />
          }
          value={
            <TranslatedReferenceData
              fallback={location?.name}
              value={location?.id}
              category="location"
              data-testid='translatedreferencedata-hk67' />
          }
        />
      )}
      {bookingType && (
        <DetailsDisplay
          label={<TranslatedText
            stringId="scheduling.bookingType.label"
            fallback="Booking type"
            data-testid='translatedtext-pvwe' />}
          value={
            <TranslatedReferenceData
              value={bookingType.id}
              fallback={bookingType.name}
              category="bookingType"
              data-testid='translatedreferencedata-4dr8' />
          }
        />
      )}
      {isOvernight && (
        <Tag>
          <Overnight aria-hidden htmlColor={Colors.primary} sx={{ fontSize: 15 }} />
          <TranslatedText
            stringId="scheduling.bookingType.overnight"
            fallback="Overnight"
            data-testid='translatedtext-j5rd' />
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
              data-testid='translatedtext-bopp' />
          }
          value={
            <TranslatedReferenceData
              value={appointmentType.id}
              fallback={appointmentType.name}
              category="appointmentType"
              data-testid='translatedreferencedata-cg99' />
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
          <TranslatedText
            stringId="general.highPriority.label"
            fallback="High priority"
            data-testid='translatedtext-xc52' />
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
        label={<TranslatedText
          stringId="general.time.label"
          fallback="Time"
          data-testid='translatedtext-ezac' />}
        value={formatDateTimeRange(startTime, endTime)}
      />
      <DetailsDisplay
        label={
          <TranslatedText
            stringId="general.localisedField.clinician.label.short"
            fallback="Clinician"
            data-testid='translatedtext-l6mv' />
        }
        value={clinician?.displayName}
      />
      <DetailsDisplay
        label={
          <TranslatedText
            stringId="general.localisedField.locationGroupId.label"
            fallback="Area"
            data-testid='translatedtext-u1ui' />
        }
        value={
          <TranslatedReferenceData
            fallback={location?.locationGroup?.name || locationGroup?.name}
            value={location?.locationGroup?.id || locationGroup?.id}
            category="locationGroup"
            data-testid='translatedreferencedata-88ax' />
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
