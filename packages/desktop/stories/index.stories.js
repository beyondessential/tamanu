import React from 'react';

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { linkTo } from '@storybook/addon-links';

import { Notification } from '../app/components/Notification';
import { DateDisplay } from '../app/components/DateDisplay';

storiesOf('Notification', module)
  .add('placeholder', () => <Notification message="Hello" />);

storiesOf('DateDisplay', module)
  .addParameters({
    note: `Shows a JS date in a locale-appropriate format. User can hover to see a more verbose date.`,
  })
  .add('placeholder', () => <DateDisplay date={new Date()} />);

