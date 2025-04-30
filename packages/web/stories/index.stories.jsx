import React from 'react';
import { storiesOf } from '@storybook/react';
import { Notification } from '../app/components/Notification';

storiesOf('Notification', module).add('placeholder', () => <Notification message="Hello" />);
