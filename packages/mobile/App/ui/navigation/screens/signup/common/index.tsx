import React, { ReactElement } from 'react';
import { UserIcon } from '/components/Icons';
import { StyledView } from '/styled/common';
import Animated from 'react-native-reanimated';
import { theme } from '/styled/theme';

export const UserIconContainer = ({ size }: { size: number }): ReactElement => {
  return (
    <StyledView as={Animated.View} height={size} width={size}>
      <UserIcon fill={theme.colors.SECONDARY_MAIN} />
    </StyledView>
  );
};
