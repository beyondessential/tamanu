import React, { ReactElement } from 'react';
import { UserIcon } from '/components/Icons';
import { StyledView } from '/styled/common';
import Animated, { Value } from 'react-native-reanimated';
import { theme } from '/styled/theme';

export const UserIconContainer = ({
  size,
}: {
  size: Value<number>;
}): ReactElement => (
  <StyledView as={Animated.View} height={size} width={size}>
    <UserIcon fill={theme.colors.SECONDARY_MAIN} />
  </StyledView>
);
