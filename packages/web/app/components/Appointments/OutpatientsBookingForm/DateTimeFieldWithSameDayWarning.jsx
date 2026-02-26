import React from 'react';
import { useFormikContext } from 'formik';

import { trimToDate } from '@tamanu/utils/dateTime';
import { useDateTime } from '@tamanu/ui-components';

import { TranslatedText } from '../../Translation';
import { useOutpatientAppointmentsQuery } from '../../../api/queries/useAppointmentsQuery';
import { DateTimeField, Field } from '../../Field';

export const DateTimeFieldWithSameDayWarning = ({ isEdit, onChange }) => {
  const { values, setFieldValue } = useFormikContext();
  const { toFacilityDateTime, getDayBoundaries } = useDateTime();

  const facilityStartStr = values.startTime ? toFacilityDateTime(values.startTime) : null;
  const facilityDate = facilityStartStr ? trimToDate(facilityStartStr) : null;
  const dayBounds = facilityDate ? getDayBoundaries(facilityDate) : null;

  const { data: existingAppointments, isFetched } = useOutpatientAppointmentsQuery(
    {
      after: dayBounds?.start ?? null,
      before: dayBounds?.end ?? null,
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
