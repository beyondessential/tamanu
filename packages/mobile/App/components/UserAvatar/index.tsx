import React from 'react';
import { StyledView, StyledText, StyledImage } from '../../styled/common';
import theme from '../../styled/theme';
import { getUserInitials, Genders } from '../../helpers/user';

interface UserAvatarProps {
  image?: string;
  name: string;
  gender: string;
}

export const UserAvatar = ({ image, name, gender }: UserAvatarProps) => {
  const userInitials: String = React.useMemo(() => getUserInitials(name), [
    image,
  ]);
  const backgroundColor: string = React.useMemo(() => {
    if (image) return 'transparent';
    return gender === Genders.MALE ? theme.colors.SAFE : theme.colors.ALERT;
  }, [gender, image]);

  return (
    <StyledView
      height={45}
      width={45}
      borderRadius={50}
      overflow="hidden"
      background={backgroundColor}
      justifyContent="center"
      alignItems="center">
      {!image ? (
        <StyledText fontSize={14} fontWeight={900} color={theme.colors.WHITE}>
          {userInitials}
        </StyledText>
      ) : (
        <StyledImage source={{ uri: image }} width={45} height={45} />
      )}
    </StyledView>
  );
};

export default UserAvatar;
