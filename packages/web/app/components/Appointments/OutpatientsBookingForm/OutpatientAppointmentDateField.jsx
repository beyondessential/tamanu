import React from 'react';
import { Field, useFormikContext } from 'formik';
import { endOfYesterday, startOfDay } from 'date-fns';

import { toDateTimeString } from '@tamanu/shared/utils/dateTime';

import { useAppointmentsQuery } from '../../../api/queries';
import { TranslatedText } from '../../Translation';
import { DateField } from '../..';

export const OutpatientAppointmentDateField = ({ isEdit }) => {
  const { values } = useFormikContext();
  const { data: existingLocationBookings, isFetched } = useAppointmentsQuery(
    {
      after: values.date ? toDateTimeString(startOfDay(new Date(values.startTime))) : null,
      before: values.date ? toDateTimeString(endOfYesterday(new Date(values.startTime))) : null,
      all: true,
      locationGroupId: values.locationGroupId,
      patientId: values.patientId,
    },
    {
      enabled: !isEdit && !!(values.date && values.locationGroupId && values.patientId),
    },
  );
  console.log(isFetched);

  const showSameDayBookingWarning =
    !isEdit &&
    isFetched &&
    values.patientId &&
    existingLocationBookings.data.some(booking => booking.patientId === values.patientId);

  return (
    <Field
      name="startTime"
      label={<TranslatedText stringId="general.dateAndTime.label" fallback="Date & time" />}
      component={DateField}
      required
      helperText={
        showSameDayBookingWarning && (
          <TranslatedText
            stringId="locationBooking.form.date.warning"
            fallback="Patient already has an appointment scheduled at this location on this day"
          />
        )
      }
    />
  );
};
