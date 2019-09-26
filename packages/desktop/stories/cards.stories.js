import React from 'react';

import { storiesOf } from '@storybook/react';

import { CallToActionCard } from '../app/components/CallToActionCard';

const log = () => console.log('action!');

storiesOf('CallToAction', module)
  .add('Plain', () => (
    <CallToActionCard
      action={log}
      avatar=""
      title="Appointment"
      description="Section description"
    />
  ))
  .add('Disabled', () => (
    <CallToActionCard
      disabled
      action={log}
      avatar=""
      title="Appointment"
      description="Disabled card"
    />
  ));
