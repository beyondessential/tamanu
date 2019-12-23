import React from 'react';
import { StyledView, StyledText, StyledImage } from '../../styled/common';
import theme from '../../styled/theme';
import { getUserInitials, Genders } from '../../helpers/user';
import { screenPercentageToDp, Orientation } from '../../helpers/screen';

interface UserAvatarProps {
  image?: string;
  name: string;
  gender: string;
}

export const UserAvatar = ({ image, name, gender }: UserAvatarProps) => {
  const userInitials: String = React.useMemo(() => getUserInitials(name), [
    name,
  ]);
  const backgroundColor: string = React.useMemo(() => {
    if (image) return 'transparent';
    return gender === Genders.MALE ? theme.colors.SAFE : theme.colors.ALERT;
  }, [gender, image]);

  return (
    <StyledView
      height={screenPercentageToDp('4.86', Orientation.Height)}
      width={screenPercentageToDp('4.86', Orientation.Height)}
      borderRadius={50}
      overflow="hidden"
      background={backgroundColor}
      justifyContent="center"
      alignItems="center"
    >
      {!image ? (
        <StyledText
          fontSize={screenPercentageToDp('1.7', Orientation.Height)}
          fontWeight={900}
          color={theme.colors.WHITE}
        >
          {userInitials}
        </StyledText>
      ) : (
        <StyledImage
          source={{ uri: image }}
          width={screenPercentageToDp('4.86', Orientation.Height)}
          height={screenPercentageToDp('4.86', Orientation.Height)}
        />
      )}
    </StyledView>
  );
};

export default UserAvatar;
