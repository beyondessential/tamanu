import React from 'react';
import { StyledView, StyledText, StyledImage } from '/styled/common';
import { theme } from '/styled/theme';
import { getUserInitials, Genders } from '/helpers/user';
import { screenPercentageToDP, Orientation } from '/helpers/screen';

export interface UserAvatarProps {
  image?: string;
  displayName: string;
  sex?: string;
  size: number;
  Icon?: JSX.Element;
}

export const UserAvatar = ({
  image,
  displayName,
  sex,
  size,
  Icon,
}: UserAvatarProps): JSX.Element => {
  const userInitials: string = React.useMemo(
    () => (displayName ? getUserInitials(displayName) : 'user'),
    [displayName],
  );
  const backgroundColor: string = React.useMemo(() => {
    if (image) return 'transparent';
    return sex === Genders.MALE ? theme.colors.SAFE : theme.colors.ALERT;
  }, [sex, image]);

  return (
    <StyledView
      height={size}
      width={size}
      borderRadius={50}
      background={backgroundColor}
      justifyContent="center"
      alignItems="center"
    >
      {!image ? (
        <StyledText
          fontSize={screenPercentageToDP('2.7', Orientation.Height)}
          fontWeight={500}
          color={theme.colors.WHITE}
        >
          {userInitials}
        </StyledText>
      ) : (
        <StyledImage source={{ uri: image }} width={size} height={size} />
      )}
      {Icon && Icon}
    </StyledView>
  );
};
