import React, { useState } from 'react';
import { ConfirmModal } from '../../ConfirmModal';
import { TranslatedText } from '../../Translation';
import FormControlLabel, { formControlLabelClasses } from '@mui/material/FormControlLabel';
import { typographyClasses } from '@mui/material/Typography';
import Radio, { radioClasses } from '@mui/material/Radio';
import styled from 'styled-components';
import { BodyText } from '../../Typography';
import { Colors } from '../../../constants';
import RadioGroup from '@mui/material/RadioGroup';

const StyledConfirmModal = styled(ConfirmModal)`
  & .MuiPaper-root {
    // width: 650px;
    max-width: 650px;
  }
`;

const ContentWrapper = styled.div`
  padding: 2rem 5rem;
`;

const RadioWrapper = styled.div`
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

export const MODIFY_REPEATING_APPOINTMENT_MODE = {
  THIS_APPOINTMENT: 'thisAppointment',
  THIS_AND_FUTURE_APPOINTMENTS: 'thisAndFutureAppointments',
};

export const ModifyRepeatingAppointmentModal = ({ open, onClose, onConfirm }) => {
  const [mode, setMode] = useState(MODIFY_REPEATING_APPOINTMENT_MODE.THIS_APPOINTMENT);

  const handleChangeMode = event => setMode(event.target.value);
  const handleConfirm = () =>
    onConfirm(mode === MODIFY_REPEATING_APPOINTMENT_MODE.THIS_AND_FUTURE_APPOINTMENTS);

  return (
    <StyledConfirmModal
      open={open}
      onClose={onClose}
      onConfirm={handleConfirm}
      title={
        <TranslatedText
          stringId="outpatientAppointment.modal.modifyRepeatingAppointment.title"
          fallback="Modify appointment"
        />
      }
      customContent={
        <ContentWrapper>
          <BodyText mb={3}>
            <TranslatedText
              stringId="outpatientAppointment.modal.modifyRepeatingAppointment.text"
              fallback="This is a repeating appointment. Would you like to modify this appointment only or this appointment and future appointments as well?"
            />
          </BodyText>
          <RadioWrapper>
            <RadioGroup
              value={mode}
              onChange={handleChangeMode}
              name="mode"
              aria-labelledby="ends-radio"
            >
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
                  <StyledRadio
                    value={MODIFY_REPEATING_APPOINTMENT_MODE.THIS_AND_FUTURE_APPOINTMENTS}
                  />
                }
                label={
                  <TranslatedText
                    stringId="outpatientAppointment.repeating.modifyMode.option.thisAndFutureAppointments"
                    fallback="This and future appointments"
                  />
                }
              />
            </RadioGroup>
          </RadioWrapper>
        </ContentWrapper>
      }
      confirmButtonText={<TranslatedText stringId="general.action.continue" fallback="Continue" />}
    />
  );
};
