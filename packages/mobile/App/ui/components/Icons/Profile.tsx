import React, { memo } from 'react';
import { Image, ImageProps } from 'react-native';

export const ProfileIcon = memo((props: ImageProps) => (
  <Image
    source={require('../../assets/newPatientIcon.png')}
    resizeMode="contain"
    {...props}
  />
));
