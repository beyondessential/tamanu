import React from 'react';
import { action } from '@storybook/addon-actions';
import { storiesOf } from '@storybook/react-native';
import { CenterView } from '/styled/common';
import { theme } from '/styled/theme';
import { PatientCard } from './index';

storiesOf('PatientCard', module)
  .addDecorator((getStory: Function) => (
    <CenterView background={theme.colors.MAIN_SUPER_DARK}>
      {getStory()}
    </CenterView>
  ))
  .add('Patient card', () => (
    <PatientCard
      onPress={action('pressed in patient-card')}
      patient={{
        id: '',
        displayId: '',
        culturalName: 'cba',
        firstName: 'firstName',
        middleName: 'middleName',
        lastName: 'lastName',
        sex: 'Female',
        dateOfBirth: new Date(2000, 1, 1),
      }}
    />
  ));
