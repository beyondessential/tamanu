import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { UserAvatar, UserAvatarProps } from './index';
import { CameraOutlineIcon, GivenOnTimeIcon } from '../Icons';
import { CenterView, StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import { screenPercentageToDP, Orientation } from '/helpers/screen';

const makeUser = (image?: string, Icon?: any): UserAvatarProps => ({
  size: 25,
  displayName: 'Johnatan Orange',
  gender: 'male',
  image,
  Icon,
});

const withoutImageProps = makeUser();

const withImageProps = makeUser(
  'https://res.cloudinary.com/dqkhy63yu/image/upload/v1573676957/Ellipse_4.png',
);

const CameraInCircle = (
  <StyledView position="absolute" right="-20%" bottom={0} zIndex={2}>
    <CenterView
      borderRadius={50}
      paddingTop={screenPercentageToDP('0.97', Orientation.Height)}
      paddingLeft={screenPercentageToDP('0.97', Orientation.Height)}
      paddingRight={screenPercentageToDP('0.97', Orientation.Height)}
      paddingBottom={screenPercentageToDP('0.97', Orientation.Height)}
      background={theme.colors.TEXT_SOFT}
    >
      <CameraOutlineIcon
        height={screenPercentageToDP('2.43', Orientation.Height)}
        width={screenPercentageToDP('2.43', Orientation.Height)}
        fill={theme.colors.WHITE}
      />
    </CenterView>
  </StyledView>
);

const withImageAndIconProps = makeUser(
  'https://res.cloudinary.com/dqkhy63yu/image/upload/v1573676957/Ellipse_4.png',
  CameraInCircle,
);

const newPatientAddedProps = makeUser(
  'https://res.cloudinary.com/dqkhy63yu/image/upload/v1573676957/Ellipse_4.png',
  <StyledView position="absolute" right="-20" bottom={30} zIndex={2}>
    <GivenOnTimeIcon
      height={screenPercentageToDP('3.88', Orientation.Height)}
      width={screenPercentageToDP('3.88', Orientation.Height)}
      fill={theme.colors.SAFE}
    />
  </StyledView>,
);

storiesOf('UserAvatar', module)
  .addDecorator((getStory: Function) => <CenterView>{getStory()}</CenterView>)
  .add('Wihouth url Image', () => <UserAvatar {...withoutImageProps} />)
  .add('With image', () => <UserAvatar {...withImageProps} />)
  .add('With image and icon (More Menu)', () => (
    <UserAvatar {...withImageAndIconProps} />
  ))
  .add('With image and icon (New Patient added)', () => (
    <UserAvatar {...newPatientAddedProps} />
  ));
