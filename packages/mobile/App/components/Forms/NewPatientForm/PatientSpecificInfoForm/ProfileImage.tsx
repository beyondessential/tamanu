import React, { useEffect, useState, ReactElement } from 'react';
import { ActivityIndicator } from 'react-native';
import { StyledImage } from '/styled/common';
import { theme } from '/styled/theme';
import { screenPercentageToDP, Orientation } from '/root/App/helpers/screen';

type ProfileImageProps = {
  uri: string;
  loading: boolean;
};

export const ProfileImage = ({
  uri,
  loading,
}: ProfileImageProps): ReactElement => {
  const [imgSize, setimgSize] = useState(0);
  useEffect(() => {
    if (!loading) {
      setimgSize(screenPercentageToDP(7.29, Orientation.Height));
    }
  }, [loading]);

  return loading ? (
    <ActivityIndicator
      color={theme.colors.PRIMARY_MAIN}
      size={screenPercentageToDP(7.29, Orientation.Height)}
    />
  ) : (
    <StyledImage height={imgSize} width={imgSize} source={{ uri: uri }} />
  );
};
