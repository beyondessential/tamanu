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

export const CreateFromNewConfirmModal = ({ open, onCancel, onConfirm }) => {
  return (
    <StyledConfirmModal
      title={
        <TranslatedText
          stringId="scheduling.modal.appointment.title.createNewAppointment"
          fallback="Create new appointment"
        />
      }
      customContent={
        <Box p={7}>
          <TranslatedText
            stringId="scehduling.modal.appointment.content.createFromNewWarning"
            fallback="This appointment is repeating and there may be future instances of this appointment already scheduled. Would you like to continue scheduling a new appointment?"
          />
        </Box>
      }
      open={open}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
};
