import React from 'react';
import { Field, useFormikContext } from 'formik';
import { endOfDay, parseISO, startOfDay } from 'date-fns';

import { toDateTimeString } from '@tamanu/shared/utils/dateTime';

import { useAppointmentsQuery } from '../../../api/queries';
import { TranslatedText } from '../../Translation';
import { DateTimeField } from '../..';

export const DateTimeFieldWithSameDayWarning = ({ isEdit }) => {
  const { values } = useFormikContext();

  const { data: existingAppointments, isFetched } = useAppointmentsQuery(
    {
      after: values.startTime ? toDateTimeString(startOfDay(new Date(values.startTime))) : null,
      before: values.startTime ? toDateTimeString(endOfDay(new Date(values.startTime))) : null,
      all: true,
      patientId: values.patientId,
    },
    {
      enabled: !isEdit && !!(values.startTime && values.patientId),
    },
  );

  const showSameDayWarning =
    !isEdit &&
    isFetched &&
    values.patientId &&
    existingAppointments?.data.some(booking => booking.patientId === values.patientId);

  return (
    <Field
      name="startTime"
      label={<TranslatedText stringId="general.dateAndTime.label" fallback="Date & time" />}
      component={DateTimeField}
      saveDateAsString
      required
      save
      helperText={
        showSameDayWarning && (
          <TranslatedText
            stringId="outpatientAppointment.date.warning"
            fallback="Patient already has an appointment scheduled for this this day"
          />
        )
      }
    />
  );
};
