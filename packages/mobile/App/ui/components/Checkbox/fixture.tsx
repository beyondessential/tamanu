import React, { useState } from 'react';
import { Checkbox } from './index';

export function BaseStory(): JSX.Element {
  const [state, setState] = useState(false);
  return (
    <Checkbox
      id="send-reminders"
      text="Send Reminders for Vaccines"
      value={state}
      onChange={setState}
    />
  );
}
