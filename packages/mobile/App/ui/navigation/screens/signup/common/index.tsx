import React, { ReactElement } from 'react';
import { UserIcon } from '/components/Icons';
import { StyledView } from '/styled/common';
import Animated, { SharedValue } from 'react-native-reanimated';
import { theme } from '/styled/theme';

export const UserIconContainer = ({
  size,
}: {
  size: SharedValue<number> | number;
}): ReactElement => (
  <StyledView as={Animated.View} height={size as number} width={size as number}>
    <UserIcon fill={theme.colors.SECONDARY_MAIN} />
  </StyledView>
);
