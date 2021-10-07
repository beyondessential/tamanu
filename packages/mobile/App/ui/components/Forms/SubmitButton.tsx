import React, { ReactElement } from 'react';
import { useFormikContext } from 'formik';
import { theme } from '/styled/theme';
import { Button } from '/components/Button';

export const SubmitButton = ({ onSubmit, ...rest }): ReactElement => {
  const { isSubmitting } = useFormikContext();
  return (
    <Button
      onPress={onSubmit}
      disabled={isSubmitting}
      buttonText={isSubmitting ? 'Submitting...' : 'Submit'}
      backgroundColor={theme.colors.PRIMARY_MAIN}
      {...rest}
    />
  );
};
