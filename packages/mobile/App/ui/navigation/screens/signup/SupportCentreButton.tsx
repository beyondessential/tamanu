import React from 'react';
import { Linking } from 'react-native';
import { LaunchIcon } from '~/ui/components/Icons';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';
import { RowView, StyledText, StyledTouchableOpacity } from '~/ui/styled/common';
import { theme } from '~/ui/styled/theme';

interface SupportCentreButtonProps {
  supportCentreUrl: string;
}

export const SupportCentreButton = ({ supportCentreUrl }: SupportCentreButtonProps) => {
  return (
    <StyledTouchableOpacity
      onPress={(): Promise<void> => Linking.openURL(supportCentreUrl)}
      marginLeft="auto"
    >
      <RowView alignItems="center">
        <StyledText fontSize={12} color={theme.colors.WHITE} textDecorationLine="underline">
          <TranslatedText stringId="externalLink.supportCentre" fallback="Support centre" />
        </StyledText>
        <LaunchIcon
          size={12}
          fill={theme.colors.WHITE}
          style={{ marginLeft: theme.spacing.space50 }}
        />
      </RowView>
    </StyledTouchableOpacity>
  );
};
