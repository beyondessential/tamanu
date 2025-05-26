import React from 'react';
import styled from 'styled-components';
import Box from '@mui/material/Box';

import { ConfirmModal } from '../../../components/ConfirmModal';
import { TranslatedText } from '../../../components';

const StyledConfirmModal = styled(ConfirmModal)`
  & .MuiPaper-root {
    max-width: 40.625rem;
  }
`;

export const CreateFromExistingConfirmModal = ({ open, onCancel, onConfirm }) => {
  return (
    <StyledConfirmModal
      title={
        <TranslatedText
          stringId="scheduling.modal.appointment.title.createNewAppointment"
          fallback="Create new appointment"
          data-testid="translatedtext-5d84"
        />
      }
      customContent={
        <Box p={7} data-testid="box-ddt6">
          <TranslatedText
            stringId="scehduling.modal.appointment.content.createFromExistingWarning"
            fallback="This appointment is repeating and there may be future instances of this appointment already scheduled. Would you like to continue scheduling a new appointment?"
            data-testid="translatedtext-qo83"
          />
        </Box>
      }
      open={open}
      onCancel={onCancel}
      onConfirm={onConfirm}
      data-testid="styledconfirmmodal-of2g"
    />
  );
};
