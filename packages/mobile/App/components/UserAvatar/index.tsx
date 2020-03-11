import React from 'react';
import { StyledView, StyledText, StyledImage } from '../../styled/common';
import { theme } from '../../styled/theme';
import { getUserInitials, Genders } from '../../helpers/user';
import { screenPercentageToDP, Orientation } from '../../helpers/screen';

interface UserAvatarProps {
  image?: string;
  name: string;
  gender: string;
  size: number;
  Icon?: JSX.Element;
}

export const UserAvatar = ({
  image,
  name,
  gender,
  size,
  Icon,
}: UserAvatarProps): JSX.Element => {
  const userInitials: string = React.useMemo(() => getUserInitials(name), [name]);
  const backgroundColor: string = React.useMemo(() => {
    if (image) return 'transparent';
    return gender === Genders.MALE ? theme.colors.SAFE : theme.colors.ALERT;
  }, [gender, image]);

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
          fontSize={screenPercentageToDP('1.7', Orientation.Height)}
          fontWeight={900}
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

export default UserAvatar;
