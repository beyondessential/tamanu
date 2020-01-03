import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { action } from '@storybook/addon-actions';

import Button from './index';
import { theme } from '../../styled/theme';
import * as Icons from '../Icons';
import { RotateView, CenterView } from '../../styled/common';

storiesOf('Button', module)
  .addDecorator((getStory: any) => <CenterView>{getStory()}</CenterView>)
  .add('Outline', () => (
    <Button
      onPress={action('clicked-text')}
      outline
      width="250"
      buttonText="Button"
    />
  ))
  .add('Filled with transparency', () => (
    <Button
      width="250"
      backgroundColor={`${theme.colors.MAIN_SUPER_DARK}E0`}
      onPress={action('clicked-filled')}
      buttonText="Click me!"
    />
  ))
  .add('Rounded', () => (
    <Button
      width="250"
      backgroundColor={`${theme.colors.MAIN_SUPER_DARK}E0`}
      bordered
      textColor={theme.colors.WHITE}
      onPress={action('rounded')}
      buttonText="Filters"
    />
  ))
  .add('Rounded with Icon', () => (
    <Button
      width="250"
      backgroundColor={`${theme.colors.MAIN_SUPER_DARK}`}
      bordered
      textColor={theme.colors.WHITE}
      onPress={action('rounded')}
      buttonText="Filters"
    >
      <RotateView>
        <Icons.OptionsGlyph fill="white" height={20} />
      </RotateView>
    </Button>
  ));
