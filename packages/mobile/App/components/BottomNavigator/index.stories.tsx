import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { App } from './fixtures';

storiesOf('BottomNavigator', module).add('Common', () => <App />);
