import React, { useState } from 'react';
import { Checkbox } from './index';

export const BaseStory = (): JSX.Element => {
  const [state, setState] = useState(false);
  return (
    <Checkbox
      text="Send Reminders for Vaccines"
      selected={state}
      onChange={setState}
    />
  );
};
