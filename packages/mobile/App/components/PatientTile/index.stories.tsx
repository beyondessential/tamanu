import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { PatientTile } from './index';
import { CenterView } from '../../styled/common';
import { MaleExampleProps, FemaleExampleProps } from './fixtures';

storiesOf('PatientTile', module)
  .addDecorator((story: Function) => <CenterView flex={1}>{story()}</CenterView>)
  .add('Male', () => <PatientTile {...MaleExampleProps} />)
  .add('Female', () => <PatientTile {...FemaleExampleProps} />)
  .add('Without last visit', () => (
    <PatientTile {...FemaleExampleProps} lastVisit={undefined} />
  ))
  .add('With Image', () => (
    <PatientTile
      {...FemaleExampleProps}
      image="https://res.cloudinary.com/dqkhy63yu/image/upload/v1573676957/Ellipse_4.png"
    />
  ));
