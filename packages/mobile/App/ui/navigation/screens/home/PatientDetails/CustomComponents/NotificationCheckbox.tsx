import React, { ReactElement } from 'react';
import { Separator } from '/components/Separator';
import { StyledView } from '/styled/common';
import { Checkbox } from '/components/Checkbox';

interface NotificationCheckboxProps {
  onChange: (value: boolean) => void;
  value: boolean;
}

export const NotificationCheckbox = (
  props: NotificationCheckboxProps,
): ReactElement => (
  <>
    <Separator marginTop={20} />
    <StyledView marginTop={20} marginBottom={20}>
      <Checkbox
        id="send-reminders"
        onChange={props.onChange}
        value={props.value}
        text="Send Reminders for Vaccines, Appointments etc..."
      />
    </StyledView>
    <Separator />
  </>
);
