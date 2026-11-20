import React from 'react';

import { TranslatedText } from '../../../components';
import { useKioskSession } from '../KioskSession';
import { CheckedInMessage } from './CheckedInScreen';

export const AlreadyCheckedInScreen = ({ onEndSession }) => {
  const { session } = useKioskSession();
  return (
    <CheckedInMessage
      title={
        <TranslatedText
          stringId="kiosk.alreadyCheckedIn.title"
          fallback="You're already checked in"
        />
      }
      appointment={session.appointment}
      onDone={onEndSession}
    />
  );
};
