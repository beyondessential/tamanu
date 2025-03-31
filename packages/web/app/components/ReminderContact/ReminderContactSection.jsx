import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import NotificationsNoneIcon from '@material-ui/icons/NotificationsNone';
import { Button } from '..';
import { ReminderContactModal } from './ReminderContactModal';
import { useAuth } from '../../contexts/Auth';
import { TranslatedText } from '../Translation/TranslatedText';

const StyledButton = styled(Button)`
  padding: 6px 8px !important;
`;

const StyledNotificationsNoneIcon = styled(NotificationsNoneIcon)`
  margin-right: 5px !important;
`;

export const ReminderContactSection = () => {
  const [openReminderModal, setOpenReminderModal] = useState(false);
  const { ability } = useAuth();
  const canReadReminderContacts = ability.can('read', 'Patient');

  const handleOpenRemindersModal = useCallback(() => {
    setOpenReminderModal(true);
  }, []);

  const onClose = useCallback(() => {
    setOpenReminderModal(false);
  }, []);

  if (!canReadReminderContacts) {
    return null;
  }

  return (
    <>
      <StyledButton
        variant="outlined"
        color="primary"
        size="small"
        onClick={handleOpenRemindersModal}
        data-testid='styledbutton-qjma'>
        <StyledNotificationsNoneIcon />
        <TranslatedText
          stringId="patient.details.reminderContacts.title"
          fallback="Reminder contacts"
          data-testid='translatedtext-r8es' />
      </StyledButton>
      <ReminderContactModal
        open={openReminderModal}
        onClose={onClose}
      />
    </>
  );
};
