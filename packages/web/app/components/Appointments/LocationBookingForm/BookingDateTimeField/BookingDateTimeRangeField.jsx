import { endOfDay, startOfDay } from 'date-fns';
import { useFormikContext } from 'formik';
import React from 'react';

import { toDateTimeString } from '@tamanu/shared/utils/dateTime';

import { useAppointmentsQuery } from '../../../../api/queries';
import { TranslatedText } from '../../../Translation';
import { DateTimePicker } from './DateTimePicker';
import { DateTimeRangePicker } from './DateTimeRangePicker';

export const BookingDateTimeRangeField = ({ editMode, separate = false, ...props }) => {
  const {
    values: { startDate, endDate, locationId, patientId },
  } = useFormikContext();
  const { data: existingLocationBookings, isFetched } = useAppointmentsQuery(
    {
      after: startDate ? toDateTimeString(startOfDay(new Date(startDate))) : null,
      before: endDate ? toDateTimeString(endOfDay(new Date(endDate))) : null,
      all: true,
      locationId,
      patientId,
    },
    { enabled: !!(startDate && endDate && locationId && patientId) },
  );

  const getStartDateFieldHelperText = () => {
    const showSameDayBookingWarning =
      !editMode &&
      isFetched &&
      patientId &&
      existingLocationBookings.data.some(booking => booking.patientId === patientId);

    return showSameDayBookingWarning ? (
      <TranslatedText
        stringId="locationBooking.form.date.warning"
        fallback="Patient already has an appointment scheduled at this location on this day"
      />
    ) : null;
  };

  if (separate) {
    return (
      <>
        <DateTimePicker dateFieldHelperText={getStartDateFieldHelperText()} name="start" />
        <DateTimePicker name="end" />
      </>
    );
  }

  return (
    <DateTimeRangePicker
      dateFieldHelperText={getStartDateFieldHelperText()}
      datePickerLabel={<TranslatedText stringId="general.date.label" fallback="Date" />}
      datePickerName="date"
      timePickerLabel={
        <TranslatedText stringId="locationBooking.bookingTime.label" fallback="Booking time" />
      }
      {...props}
    />
  );
};
