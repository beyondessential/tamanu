import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { UserAvatar } from './index';
import { CenterView } from '../CenterView';

const withoutImageProps = {
  name: 'Johnatan Orange',
  gender: 'male',
};

const withImageProps = {
  name: 'Johnatan Orange',
  gender: 'male',
  image:
    'https://res.cloudinary.com/dqkhy63yu/image/upload/v1573676957/Ellipse_4.png',
};

storiesOf('UserAvatar', module)
  .addDecorator((getStory: Function) => <CenterView>{getStory()}</CenterView>)
  .add('Wihouth url Image', () => <UserAvatar {...withoutImageProps} />)
  .add('With image', () => <UserAvatar {...withImageProps} />);
