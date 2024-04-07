import React from 'react';
import { Linking } from 'react-native';
import { LaunchIcon } from '~/ui/components/Icons';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { RowView, StyledText, StyledTouchableOpacity } from '~/ui/styled/common';
import { theme } from '~/ui/styled/theme';

type SupportCentreButtonProps = {
  supportCentreUrl: string;
};

export const SupportCentreButton = ({ supportCentreUrl }: SupportCentreButtonProps) => {
  return (
    <StyledTouchableOpacity onPress={(): Promise<void> => Linking.openURL(supportCentreUrl)}>
      <RowView alignItems="center">
        <StyledText
          fontSize={screenPercentageToDP('1.28', Orientation.Height)}
          color={theme.colors.WHITE}
          textDecorationLine="underline"
        >
          Support centre
        </StyledText>
        <LaunchIcon
          size={screenPercentageToDP('1.57', Orientation.Height)}
          fill={theme.colors.WHITE}
          style={{ marginLeft: screenPercentageToDP('0.72', Orientation.Width) }}
        />
      </RowView>
    </StyledTouchableOpacity>
  );
};
