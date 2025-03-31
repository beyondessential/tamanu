import React from 'react';
import { useFormikContext } from 'formik';
import { endOfDay, parseISO, startOfDay } from 'date-fns';

import { toDateTimeString } from '@tamanu/utils/dateTime';

import { TranslatedText } from '../../Translation';
import { useOutpatientAppointmentsQuery } from '../../../api/queries/useAppointmentsQuery';
import { DateTimeField, Field } from '../../Field';

export const DateTimeFieldWithSameDayWarning = ({ isEdit, onChange }) => {
  const { values, setFieldValue } = useFormikContext();

  const { data: existingAppointments, isFetched } = useOutpatientAppointmentsQuery(
    {
      after: values.startTime ? toDateTimeString(startOfDay(parseISO(values.startTime))) : null,
      before: values.startTime ? toDateTimeString(endOfDay(parseISO(values.startTime))) : null,
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
      label={<TranslatedText
        stringId="general.dateAndTime.label"
        fallback="Date & time"
        data-test-id='translatedtext-t799' />}
      component={DateTimeField}
      saveDateAsString
      required
      onChange={e => {
        onChange(e);
        if (!e.target.value) setFieldValue('endTime', undefined);
      }}
      helperText={
        showSameDayWarning && (
          <TranslatedText
            stringId="outpatientAppointment.date.warning"
            fallback="Patient already has an appointment scheduled for this day"
            data-test-id='translatedtext-9bxj' />
        )
      }
      data-test-id='field-83xd' />
  );
};
