import React from 'react';
import { useFormikContext } from 'formik';
import { endOfDay, parseISO, startOfDay } from 'date-fns';

import { toDateTimeString } from '@tamanu/utils/dateTime';
import { useDateTime } from '@tamanu/ui-components';

import { TranslatedText } from '../../Translation';
import { useOutpatientAppointmentsQuery } from '../../../api/queries/useAppointmentsQuery';
import { DateTimeField, Field } from '../../Field';

export const DateTimeFieldWithSameDayWarning = ({ isEdit, onChange }) => {
  const { values, setFieldValue } = useFormikContext();
  const { toStoredDateTime } = useDateTime();

  // values.startTime is in facility timezone; convert to global timezone for API query
  const countryStartTime = values.startTime ? toStoredDateTime(values.startTime) : null;

  const { data: existingAppointments, isFetched } = useOutpatientAppointmentsQuery(
    {
      after: countryStartTime ? toDateTimeString(startOfDay(parseISO(countryStartTime))) : null,
      before: countryStartTime ? toDateTimeString(endOfDay(parseISO(countryStartTime))) : null,
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
    existingAppointments?.data.some((booking) => booking.patientId === values.patientId);

  return (
    <Field
      name="startTime"
      label={
        <TranslatedText
          stringId="general.dateAndTime.label"
          fallback="Date & time"
          data-testid="translatedtext-cg8p"
        />
      }
      component={DateTimeField}
      saveDateAsString
      useTimezone={false}
      required
      onChange={(e) => {
        onChange(e);
        if (!e.target.value) setFieldValue('endTime', undefined);
      }}
      helperText={
        showSameDayWarning && (
          <TranslatedText
            stringId="outpatientAppointment.date.warning"
            fallback="Patient already has an appointment scheduled for this day"
            data-testid="translatedtext-x8dd"
          />
        )
      }
      data-testid="field-vjma"
    />
  );
};
