import { Checkbox } from '/components/Checkbox';
import { Separator } from '/components/Separator';
import { StyledView } from '/styled/common';
import React, { ReactElement } from 'react';

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
