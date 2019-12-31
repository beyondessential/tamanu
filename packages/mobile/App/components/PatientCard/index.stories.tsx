import React from 'react';
import { action } from '@storybook/addon-actions';
import { storiesOf } from '@storybook/react-native';
import { PatientCard } from './index';
import { CenterView } from '../../styled/common';
import theme from '../../styled/theme';

storiesOf('PatientCard', module)
  .addDecorator((getStory: Function) => (
    <CenterView background={theme.colors.MAIN_SUPER_DARK}>
      {getStory()}
    </CenterView>
  ))
  .add('With Image', () => (
    <PatientCard
      onPress={action('pressed in patient-card')}
      city="Mbelagha"
      name="Ugyen Wangdi"
      gender="Female"
      age="34"
      image="https://res.cloudinary.com/dqkhy63yu/image/upload/v1573676957/Ellipse_4.png"
      lastVisit={new Date()}
    />
  ))
  .add('Without Image', () => (
    <PatientCard
      onPress={action('pressed in patient-card wihout image')}
      city="Nguvia"
      name="Leinani Tanangada"
      gender="Female"
      age="12"
      lastVisit={new Date()}
    />
  ));
