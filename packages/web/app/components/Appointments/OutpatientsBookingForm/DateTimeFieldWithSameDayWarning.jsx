import React from 'react';
import { Field, useFormikContext } from 'formik';
import { endOfDay, parseISO, startOfDay } from 'date-fns';

import { toDateTimeString } from '@tamanu/shared/utils/dateTime';

import { TranslatedText } from '../../Translation';
import { DateTimeField } from '../..';
import { useOutpatientAppointmentsQuery } from '../../../api/queries/useAppointmentsQuery';

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
      label={<TranslatedText stringId="general.dateAndTime.label" fallback="Date & time" />}
      component={DateTimeField}
      onChange={onChange}
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
