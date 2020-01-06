import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { App } from './fixtures';

storiesOf('App Intro', module).add('Common', () => <App />);
