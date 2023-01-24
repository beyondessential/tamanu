import React from 'react';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { StyledText, StyledTouchableOpacity, StyledView } from '~/ui/styled/common';
import { theme } from '~/ui/styled/theme';
import { Alert, AlertSeverity } from '../Alert';

export const SyncInactiveAlert = (): JSX.Element => {
  const handleShowReconnect = (): void => {};
  return (
    <Alert severity={AlertSeverity.Info}>
      <StyledText
        color={theme.colors.PRIMARY_MAIN}
        fontSize={screenPercentageToDP(1.68, Orientation.Height)}
      >
        Sync inactive.
      </StyledText>
      <StyledTouchableOpacity onPress={handleShowReconnect}>
        <StyledText
          marginLeft={screenPercentageToDP(1, Orientation.Width)}
          color={theme.colors.PRIMARY_MAIN}
          textDecorationLine="underline"
          fontSize={screenPercentageToDP(1.68, Orientation.Height)}>Click here to reconnnect.
        </StyledText>
      </StyledTouchableOpacity>
    </Alert>
  );
};
