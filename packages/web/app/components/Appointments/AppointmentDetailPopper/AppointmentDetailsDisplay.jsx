import { PriorityHigh as HighPriorityIcon } from '@mui/icons-material';
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
              data-testid="translatedtext-ic34"
            />
          }
          value={
            <TranslatedReferenceData
              fallback={location?.name}
              value={location?.id}
              category="location"
              data-testid="translatedreferencedata-505o"
            />
          }
          data-testid="detailsdisplay-zzp3"
        />
      )}
      {bookingType && (
        <DetailsDisplay
          label={
            <TranslatedText
              stringId="scheduling.bookingType.label"
              fallback="Booking type"
              data-testid="translatedtext-p3sl"
            />
          }
          value={
            <TranslatedReferenceData
              value={bookingType.id}
              fallback={bookingType.name}
              category="bookingType"
              data-testid="translatedreferencedata-phvh"
            />
          }
          data-testid="detailsdisplay-lr0i"
        />
      )}
      {isOvernight && (
        <Tag data-testid="tag-j3j7">
          <Overnight
            aria-hidden
            htmlColor={Colors.primary}
            sx={{ fontSize: 15 }}
            data-testid="overnight-ginj"
          />
          <TranslatedText
            stringId="scheduling.bookingType.overnight"
            fallback="Overnight"
            data-testid="translatedtext-0ddf"
          />
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
              data-testid="translatedtext-v4x2"
            />
          }
          value={
            <TranslatedReferenceData
              value={appointmentType.id}
              fallback={appointmentType.name}
              category="appointmentType"
              data-testid="translatedreferencedata-u7us"
            />
          }
          data-testid="detailsdisplay-ll5z"
        />
      )}
      {isHighPriority && (
        <Tag data-testid="tag-aesu">
          <HighPriorityIcon
            aria-label="High priority"
            htmlColor={Colors.alert}
            style={{ fontSize: 15 }}
            data-testid="highpriorityicon-kkvr"
          />
          <TranslatedText
            stringId="general.highPriority.label"
            fallback="High priority"
            data-testid="translatedtext-ajux"
          />
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
    <AppointmentDetailsContainer data-testid="appointmentdetailscontainer-8rgc">
      <DetailsDisplay
        label={
          <TranslatedText
            stringId="general.time.label"
            fallback="Time"
            data-testid="translatedtext-cljh"
          />
        }
        value={formatDateTimeRange(startTime, endTime)}
        data-testid="detailsdisplay-diun"
      />
      <DetailsDisplay
        label={
          <TranslatedText
            stringId="general.localisedField.clinician.label.short"
            fallback="Clinician"
            data-testid="translatedtext-12cf"
          />
        }
        value={clinician?.displayName}
        data-testid="detailsdisplay-an8y"
      />
      <DetailsDisplay
        label={
          <TranslatedText
            stringId="general.localisedField.locationGroupId.label"
            fallback="Area"
            data-testid="translatedtext-f8to"
          />
        }
        value={
          <TranslatedReferenceData
            fallback={location?.locationGroup?.name || locationGroup?.name}
            value={location?.locationGroup?.id || locationGroup?.id}
            category="locationGroup"
            data-testid="translatedreferencedata-gbn6"
          />
        }
        data-testid="detailsdisplay-w60y"
      />
      {/* Location booking specific data */}
      {location && bookingType && (
        <LocationBookingDetails
          location={location}
          bookingType={bookingType}
          isOvernight={isOvernight}
          data-testid="locationbookingdetails-g1r6"
        />
      )}
      {/* Outpatient appointment specific data */}
      {appointmentType && (
        <AppointmentTypeDetails
          appointmentType={appointmentType}
          isHighPriority={isHighPriority}
          data-testid="appointmenttypedetails-vpuq"
        />
      )}
    </AppointmentDetailsContainer>
  );
};
