import React from 'react';

import { TranslatedText } from '../../../components';
import { CheckedInMessage } from './CheckedInScreen';

export const AlreadyCheckedInScreen = ({ onEndSession }) => (
  <CheckedInMessage
    title={
      <TranslatedText
        stringId="kiosk.alreadyCheckedIn.title"
        fallback="You're already checked in"
      />
    }
    onDone={onEndSession}
  />
);
