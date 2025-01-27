import React, { useState } from 'react';
import styled from 'styled-components';

import { MODIFY_REPEATING_APPOINTMENT_MODE } from '@tamanu/constants';

import { ConfirmModal } from '../../ConfirmModal';
import { TranslatedText } from '../../Translation';
import { BodyText } from '../../Typography';
import { ModifyModeRadioGroup } from '../ModifyModeRadioGroup';
import { Colors } from '../../../constants';

const RadioGroupWrapper = styled.div`
  background-color: ${Colors.white};
  border-radius: 3px;
  border: 1px solid ${Colors.outline};
  padding: 16px;
`;

const StyledConfirmModal = styled(ConfirmModal)`
  & .MuiPaper-root {
    max-width: 650px;
  }
`;

const ContentWrapper = styled.div`
  padding: 2rem 5rem;
`;

export const ModifyRepeatingAppointmentModal = ({ open, onClose, onConfirm }) => {
  const [mode, setMode] = useState(MODIFY_REPEATING_APPOINTMENT_MODE.THIS_APPOINTMENT);

  return (
    <StyledConfirmModal
      open={open}
      onCancel={onClose}
      onConfirm={() => onConfirm(mode)}
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
          <RadioGroupWrapper>
            <ModifyModeRadioGroup onChange={event => setMode(event.target.value)} value={mode} />
          </RadioGroupWrapper>
        </ContentWrapper>
      }
      confirmButtonText={<TranslatedText stringId="general.action.continue" fallback="Continue" />}
    />
  );
};
