import React, { useEffect } from 'react';

import { TranslatedText } from '../../../components';
import { CheckIcon } from '../KioskIcons';
import { Lead, Panel, SecondaryButton, StateIcon, Title } from '../kioskStyles';

const RETURN_TO_START_MS = 15 * 1000;

export const CheckedInMessage = ({ title, onDone }) => {
  // Return to the landing page on its own, ready for the next patient
  useEffect(() => {
    const timeout = setTimeout(onDone, RETURN_TO_START_MS);
    return () => clearTimeout(timeout);
  }, [onDone]);

  return (
    <Panel $centred>
      <StateIcon $tone="success">
        <CheckIcon />
      </StateIcon>
      <Title>{title}</Title>
      <Lead>
        <TranslatedText
          stringId="kiosk.checkedIn.text"
          fallback="Please take a seat. We'll call you when it's time."
        />
      </Lead>
      <SecondaryButton $wide onClick={onDone} data-testid="kiosk-done">
        <TranslatedText stringId="general.action.done" fallback="Done" />
      </SecondaryButton>
    </Panel>
  );
};

export const CheckedInScreen = ({ onEndSession }) => (
  <CheckedInMessage
    title={<TranslatedText stringId="kiosk.checkedIn.title" fallback="You're checked in" />}
    onDone={onEndSession}
  />
);
