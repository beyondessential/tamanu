import React, { ReactElement } from 'react';
import { useFormikContext } from 'formik';
import { theme } from '/styled/theme';
import { Button, StyledButtonProps } from '/components/Button';

interface SubmitButtonProps extends StyledButtonProps {
  onSubmit?: () => Promise<void>;
}

export const SubmitButton = ({ onSubmit, ...props }: SubmitButtonProps): ReactElement => {
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
