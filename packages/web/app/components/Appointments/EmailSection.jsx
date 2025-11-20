import React, { useEffect } from 'react';
import { useFormikContext } from 'formik';

import { Field, TranslatedText, TextField } from '@tamanu/ui-components';

import { usePatientDataQuery } from '../../api/queries';
import { CheckField } from '../Field';

export const EmailSection = () => {
  const { setFieldValue, values } = useFormikContext();
  const { data: patient } = usePatientDataQuery(values.patientId);

  // Keep form state up to date with relevant selected patient email
  useEffect(() => {
    setFieldValue('email', patient?.email ?? '');
    setFieldValue('confirmEmail', '');
  }, [patient?.email, setFieldValue]);

  const handleResetEmailFields = e => {
    if (e.target.checked) return;
    setFieldValue('email', '');
    setFieldValue('confirmEmail', '');
  };

  return (
    <>
      <Field
        name="shouldEmailAppointment"
        label={
          <TranslatedText
            stringId="appointment.emailAppointment.label"
            fallback="Email appointment"
            data-testid="translatedtext-edpi"
          />
        }
        component={CheckField}
        onChange={handleResetEmailFields}
        data-testid="field-160d"
      />
      {values.shouldEmailAppointment && (
        <>
          <Field
            name="email"
            label={
              <TranslatedText
                stringId="appointment.emailAddress.label"
                fallback="Email address"
                data-testid="translatedtext-7bci"
              />
            }
            required
            component={TextField}
            data-testid="field-bnf9"
          />
          <Field
            name="confirmEmail"
            label={
              <TranslatedText
                stringId="appointment.confirmEmailAddress.label"
                fallback="Confirm email address"
                data-testid="translatedtext-em08"
              />
            }
            required
            component={TextField}
            data-testid="field-2bi5"
          />
        </>
      )}
    </>
  );
};
