import React from 'react';
import styled from 'styled-components';
import { typographyClasses } from '@mui/material/Typography';
import FormControlLabel, { formControlLabelClasses } from '@mui/material/FormControlLabel';
import Radio, { radioClasses } from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';

import { MODIFY_REPEATING_APPOINTMENT_MODE } from '@tamanu/constants';

import { TranslatedText } from '../../Translation';
import { Colors } from '../../../constants';

const Wrapper = styled.div`
  background-color: ${Colors.white};
  border-radius: 3px;
  border: 1px solid ${Colors.outline};
  padding: 16px;
`;

const StyledRadio = styled(Radio)`
  &.${radioClasses.root} {
    color: ${Colors.primary};
    padding: 13px 12px;
  }
  & svg {
    width: 1.2rem;
    height: 1.2rem;
  }
`;

const StyledFormControlLabel = styled(FormControlLabel)`
  &.${formControlLabelClasses.root} {
    margin-left: 0;
    margin-right: 0;
    & .${typographyClasses.root} {
      font-size: 14px;
      margin-left: 0;
      color: ${Colors.darkestText};
    }
  }
`;

export const ModifyModeRadioGroup = ({ onChange, value }) => (
  <Wrapper>
    <RadioGroup value={value} onChange={onChange} name="mode" aria-labelledby="ends-radio">
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
    </RadioGroup>
  </Wrapper>
);
