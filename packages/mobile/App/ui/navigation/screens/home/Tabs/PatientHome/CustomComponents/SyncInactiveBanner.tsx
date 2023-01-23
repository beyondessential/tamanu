import React from 'react';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { StyledText, StyledTouchableOpacity, StyledView } from '~/ui/styled/common';
import { theme } from '~/ui/styled/theme';

export const SyncInactiveBanner = (): JSX.Element => {
  const handleShowReconnect = (): void => {};
  return (
    <StyledView
      padding={screenPercentageToDP(3.6, Orientation.Width)}
      marginTop={screenPercentageToDP(5, Orientation.Height)}>
      <StyledView
        width="100%"
        height={screenPercentageToDP(6.6, Orientation.Height)}
        background="rgba(50, 102, 153, 0.2)"
        borderRadius={3}
        borderWidth={1}
        flexDirection="row"
        borderColor={theme.colors.PRIMARY_MAIN}
        alignItems="center"
        paddingLeft={screenPercentageToDP(3, Orientation.Width)}
      >
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
      </StyledView>
    </StyledView>
  );
};
