import React from 'react';
import { StyledTouchableOpacity } from '~/ui/styled/common';
import { RowView } from '~/ui/styled/common';
import { Linking } from 'react-native';
import { StyledText } from '~/ui/styled/common';
import { LaunchIcon } from '~/ui/components/Icons';
import { screenPercentageToDP } from '~/ui/helpers/screen';
import { Orientation } from '~/ui/helpers/screen';
import { theme } from '~/ui/styled/theme';

type SupportCentreButtonProps = {
  supportCentreUrl: string;
};

export const SupportCentreButton = ({supportCentreUrl} : SupportCentreButtonProps) => {
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
