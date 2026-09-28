import React from 'react';
import { StyledText, StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import { Genders, getUserInitials } from '/helpers/user';
import { Orientation, screenPercentageToDP } from '/helpers/screen';

export interface UserAvatarProps {
  displayName: string;
  sex?: string;
  size: number;
  Icon?: JSX.Element;
}

export const UserAvatar = ({
  displayName,
  sex,
  size,
  Icon,
}: UserAvatarProps): JSX.Element => {
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
      {Icon}
    </StyledView>
  );
};
