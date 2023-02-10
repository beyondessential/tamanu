import React, { ReactElement } from 'react';
import { useFormikContext } from 'formik';
import { theme } from '/styled/theme';
import { Button } from '/components/Button';
import { FORM_STATUSES } from '/helpers/constants';

export const SubmitButton = (props): ReactElement => {
  const { isSubmitting, submitForm, setStatus } = useFormikContext();
  const handleSubmit = (values, formikActions) => {
    setStatus(FORM_STATUSES.SUBMIT_ATTEMPTED);
    submitForm(values, formikActions);
  };
  return (
    <Button
      onPress={handleSubmit}
      disabled={isSubmitting}
      buttonText={isSubmitting ? 'Submitting...' : 'Submit'}
      backgroundColor={theme.colors.PRIMARY_MAIN}
      {...props}
    />
  );
};
