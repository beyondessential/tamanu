import React, { useCallback, useState, ReactElement } from 'react';
import { useFormikContext } from 'formik';
import { theme } from '/styled/theme';
import { Button, StyledButtonProps } from '/components/Button';

interface SubmitButtonProps extends StyledButtonProps {
  onSubmit?: () => Promise<void>;
}

export const SubmitButton = ({ onSubmit, ...props }: SubmitButtonProps): ReactElement => {
  const { submitForm } = useFormikContext();
  const [isLoading, setIsLoading] = useState(false);
  const handleOnPress = useCallback(async () => {
    setIsLoading(true);
    try {
      if (typeof onSubmit === 'function') {
        await onSubmit();
      } else if (typeof submitForm === 'function') {
        await submitForm();
      }
    } catch (e) {
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [onSubmit, submitForm]);
  return (
    <Button
      onPress={handleOnPress}
      loadingAction={isLoading}
      buttonText="Submit"
      backgroundColor={theme.colors.PRIMARY_MAIN}
      {...props}
    />
  );
};
