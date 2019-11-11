import React from 'react';

import { storiesOf } from '@storybook/react';

import { Notification } from '../app/components/Notification';
import { DateDisplay } from '../app/components/DateDisplay';
import { PatientStickerLabel, PatientStickerLabelPage } from '../app/components/PatientStickerLabel';

import { PATIENTS } from 'Shared/demoData';

storiesOf('Notification', module).add('placeholder', () => <Notification message="Hello" />);

storiesOf('DateDisplay', module)
  .addParameters({
    note:
      'Shows a JS date in a locale-appropriate format. User can hover to see a more verbose date.',
  })
  .add('placeholder', () => <DateDisplay date={new Date()} />)
  .add('with duration', () => <DateDisplay date={new Date(2010, 10, 10)} showDuration />);

storiesOf('PatientStickerLabel', module)
  .add('default', () => <PatientStickerLabel patient={PATIENTS[0]} />)
  .add('page', () => <PatientStickerLabelPage patient={PATIENTS[0]} />);
