import React from 'react';
import styled from 'styled-components';
import { typographyClasses } from '@mui/material/Typography';
import FormControlLabel, { formControlLabelClasses } from '@mui/material/FormControlLabel';
import Radio, { radioClasses } from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';

import { MODIFY_REPEATING_APPOINTMENT_MODE } from '@tamanu/constants';

import { TranslatedText } from '../Translation';
import { Colors } from '../../constants';

const StyledRadioGroup = styled(RadioGroup)`
  gap: 0.75rem;
`;

const StyledRadio = styled(Radio)`
  &.${radioClasses.root} {
    color: ${Colors.primary};
    padding: 0.375rem;
  }
  & svg {
    width: 1.2rem;
    height: 1.2rem;
  }
`;

const StyledFormControlLabel = styled(FormControlLabel)`
  &.${formControlLabelClasses.root} {
    margin-left: -0.375rem;
    & .${typographyClasses.root} {
      font-size: 14px;
      margin-left: 0.375rem;
      color: ${Colors.darkestText};
    }
  }
`;

export const ModifyModeRadioGroup = ({ onChange, value }) => (
  <StyledRadioGroup value={value} onChange={onChange} name="mode">
    <StyledFormControlLabel
      control={<StyledRadio value={MODIFY_REPEATING_APPOINTMENT_MODE.THIS_APPOINTMENT} />}
      label={
        <TranslatedText
          stringId="outpatientAppointment.repeating.modifyMode.option.thisAppointment"
          fallback="This appointment"
        />
      }
    />
    <StyledFormControlLabel
      control={
        <StyledRadio value={MODIFY_REPEATING_APPOINTMENT_MODE.THIS_AND_FUTURE_APPOINTMENTS} />
      }
      label={
        <TranslatedText
          stringId="outpatientAppointment.repeating.modifyMode.option.thisAndFutureAppointments"
          fallback="This and future appointments"
        />
      }
    />
  </StyledRadioGroup>
);
