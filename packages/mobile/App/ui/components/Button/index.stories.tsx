import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { action } from '@storybook/addon-actions';
import { theme } from '/styled/theme';
import { CenterView, StyledView } from '/styled/common';
import { Button } from './index';
import * as Icons from '../Icons';

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
      onPress={action('rounded-with-icon')}
      buttonText="Filters"
    >
      <StyledView marginRight={10}>
        <Icons.FilterIcon fill="white" height={20} />
      </StyledView>
    </Button>
  ));
