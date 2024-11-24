import React from 'react';
import { Field, useFormikContext } from 'formik';
import { endOfDay, startOfDay } from 'date-fns';

import { toDateTimeString } from '@tamanu/shared/utils/dateTime';

import { useAppointmentsQuery } from '../../../api/queries';
import { TranslatedText } from '../../Translation';
import { DateTimeField } from '../..';

export const OutpatientAppointmentDateField = ({ isEdit }) => {
  const { values } = useFormikContext();

  const { data: existingLocationBookings, isFetched } = useAppointmentsQuery(
    {
      after: values.startTime ? toDateTimeString(startOfDay(new Date(values.startTime))) : null,
      before: values.startTime ? toDateTimeString(endOfDay(new Date(values.startTime))) : null,
      all: true,
      locationGroupId: values.locationGroupId,
      patientId: values.patientId,
    },
    {
      enabled: !isEdit && !!(values.startTime && values.locationGroupId && values.patientId),
    },
  );

  const showSameDayBookingWarning =
    !isEdit &&
    isFetched &&
    values.patientId &&
    existingLocationBookings.data.some(booking => booking.patientId === values.patientId);

  return (
    <Field
      name="startTime"
      label={<TranslatedText stringId="general.dateAndTime.label" fallback="Date & time" />}
      component={DateTimeField}
      required
      save
      helperText={
        showSameDayBookingWarning && (
          <TranslatedText
            stringId="outpatientBookingForm.form.date.warning"
            fallback="Patient already has an appointment scheduled at this area on this day"
          />
        )
      }
    />
  );
};
