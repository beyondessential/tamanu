import React, { ReactElement } from 'react';
import { useFormikContext } from 'formik';
import { theme } from '/styled/theme';
import { Button } from '/components/Button';

export const SubmitButton = ({ onSubmit = null, ...props }): ReactElement => {
  const { isSubmitting, submitForm } = useFormikContext();
  return (
    <Button
      onPress={onSubmit || submitForm}
      disabled={isSubmitting}
      buttonText={isSubmitting ? 'Submitting...' : 'Submit'}
      backgroundColor={theme.colors.PRIMARY_MAIN}
      {...props}
    />
  );
};
