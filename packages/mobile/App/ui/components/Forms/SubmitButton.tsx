import React, { ReactElement } from 'react';
import { useFormikContext } from 'formik';
import { theme } from '/styled/theme';
import { Button } from '/components/Button';

export const SubmitButton = (props): ReactElement => {
  const { isSubmitting, submitForm } = useFormikContext();
  return (
    <Button
      onPress={submitForm}
      disabled={isSubmitting}
      buttonText={isSubmitting ? 'Submitting...' : 'Submit'}
      backgroundColor={theme.colors.PRIMARY_MAIN}
      {...props}
    />
  );
};
