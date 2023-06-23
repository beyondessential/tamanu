import React, { ReactElement } from 'react';
import { StyledText } from '/styled/common';
import { theme } from '/styled/theme';

type FormValidationMessageProps = {
  message: string;
};

export const FormValidationMessage = ({
  message,
}: FormValidationMessageProps): ReactElement => {
  if (!message) return null;

  return (
    <StyledText
      fontSize={16}
      color={theme.colors.ALERT}
      textAlign="center"
    >
      {message}
    </StyledText>
  );
};
