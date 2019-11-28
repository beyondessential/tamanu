import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { BottomTabApp } from './fixtures';

storiesOf('BottomNavigator', module).add('Common', () => <BottomTabApp />);
