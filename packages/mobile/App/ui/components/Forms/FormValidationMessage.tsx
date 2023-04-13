import React, { ReactElement } from 'react';
import { StyledText } from '/styled/common';
import { theme } from '/styled/theme';
import { Orientation, screenPercentageToDP } from '/helpers/screen';

type FormValidationMessageProps = {
  message: string;
};

export const FormValidationMessage = ({ message }: FormValidationMessageProps): ReactElement => {
  if (!message) return null;

  return (
    <StyledText
      fontSize={14}
      marginTop={screenPercentageToDP('2', Orientation.Height)}
      color={theme.colors.ALERT}
    >
      {message}
    </StyledText>
  );
};
