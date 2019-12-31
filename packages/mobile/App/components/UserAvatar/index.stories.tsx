import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { UserAvatar } from './index';
import { Camera1, Checked } from '../Icons';
import { CenterView, StyledView } from '../../styled/common';
import theme from '../../styled/theme';
import { screenPercentageToDp, Orientation } from '../../helpers/screen';

const withoutImageProps = {
  size: 25,
  name: 'Johnatan Orange',
  gender: 'male',
};

const withImageProps = {
  size: 25,
  name: 'Johnatan Orange',
  gender: 'male',
  image:
    'https://res.cloudinary.com/dqkhy63yu/image/upload/v1573676957/Ellipse_4.png',
};

const CameraInCircle = (
  <StyledView position="absolute" right="-20%" bottom={0} zIndex={2}>
    <CenterView
      borderRadius={50}
      paddingTop={screenPercentageToDp('0.97', Orientation.Height)}
      paddingLeft={screenPercentageToDp('0.97', Orientation.Height)}
      paddingRight={screenPercentageToDp('0.97', Orientation.Height)}
      paddingBottom={screenPercentageToDp('0.97', Orientation.Height)}
      background={theme.colors.TEXT_SOFT}
    >
      <Camera1
        height={screenPercentageToDp('2.43', Orientation.Height)}
        width={screenPercentageToDp('2.43', Orientation.Height)}
        fill={theme.colors.WHITE}
      />
    </CenterView>
  </StyledView>
);

const withImageAndIconProps = {
  size: screenPercentageToDp('9.72', Orientation.Height),
  name: 'Alice Klein',
  gender: 'female',
  image:
    'https://res.cloudinary.com/dqkhy63yu/image/upload/v1573676957/Ellipse_4.png',
  Icon: CameraInCircle,
};

const newPatientAddedProps = {
  size: screenPercentageToDp('16.40', Orientation.Height),
  name: 'Alice Klein',
  gender: 'female',
  image:
    'https://res.cloudinary.com/dqkhy63yu/image/upload/v1573676957/Ellipse_4.png',
  Icon: (
    <StyledView position="absolute" right="-20" bottom={30} zIndex={2}>
      <Checked
        height={screenPercentageToDp('3.88', Orientation.Height)}
        width={screenPercentageToDp('3.88', Orientation.Height)}
        fill={theme.colors.SAFE}
      />
    </StyledView>
  ),
};

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
