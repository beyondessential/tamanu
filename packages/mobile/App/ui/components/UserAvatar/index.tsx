import React from 'react';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { Genders, getUserInitials } from '/helpers/user';
import { StyledText, StyledView } from '/styled/common';
import { theme } from '/styled/theme';

export interface UserAvatarProps {
  displayName: string;
  icon?: React.ReactNode;
  sex?: string;
  size: number;
}

export const UserAvatar = ({ displayName, icon, sex, size }: UserAvatarProps) => {
  const userInitials: string = React.useMemo(
    () => (displayName ? getUserInitials(displayName) : 'user'),
    [displayName],
  );
  const backgroundColor = sex === Genders.MALE ? theme.colors.SAFE : theme.colors.ALERT;

  return (
    <StyledView
      height={size}
      width={size}
      borderRadius={50}
      background={backgroundColor}
      justifyContent="center"
      alignItems="center"
    >
      <StyledText
        fontSize={screenPercentageToDP('2.7', Orientation.Height)}
        fontWeight={500}
        color={theme.colors.WHITE}
      >
        {userInitials}
      </StyledText>
      {icon}
    </StyledView>
  );
};
