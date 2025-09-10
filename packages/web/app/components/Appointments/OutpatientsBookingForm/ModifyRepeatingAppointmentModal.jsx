import React from 'react';
import styled from 'styled-components';

import { TAMANU_COLORS, TranslatedText } from '@tamanu/ui-components';
import { ConfirmModal } from '../../ConfirmModal';
import { BodyText } from '../../Typography';
import { ModifyModeRadioGroup } from '../ModifyModeRadioGroup';

const RadioGroupWrapper = styled.div`
  background-color: ${TAMANU_COLORS.white};
  border-radius: 3px;
  border: 1px solid ${TAMANU_COLORS.outline};
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

export const ModifyRepeatingAppointmentModal = ({
  open,
  onClose,
  onConfirm,
  onChangeModifyMode,
  modifyMode,
}) => {
  return (
    <StyledConfirmModal
      open={open}
      onCancel={onClose}
      onConfirm={onConfirm}
      title={
        <TranslatedText
          stringId="outpatientAppointment.modal.modifyRepeatingAppointment.title"
          fallback="Modify appointment"
          data-testid="translatedtext-uqqm"
        />
      }
      customContent={
        <ContentWrapper data-testid="contentwrapper-3vhr">
          <BodyText mb={3} data-testid="bodytext-s636">
            <TranslatedText
              stringId="outpatientAppointment.modal.modifyRepeatingAppointment.text"
              fallback="This is a repeating appointment. Would you like to modify this appointment only or this appointment and future appointments as well?"
              data-testid="translatedtext-0kbo"
            />
          </BodyText>
          <RadioGroupWrapper data-testid="radiogroupwrapper-ekvd">
            <ModifyModeRadioGroup
              onChange={(event) => onChangeModifyMode(event.target.value)}
              value={modifyMode}
              data-testid="modifymoderadiogroup-9f8m"
            />
          </RadioGroupWrapper>
        </ContentWrapper>
      }
      confirmButtonText={
        <TranslatedText
          stringId="general.action.continue"
          fallback="Continue"
          data-testid="translatedtext-fnmr"
        />
      }
      data-testid="styledconfirmmodal-jzu3"
    />
  );
};
