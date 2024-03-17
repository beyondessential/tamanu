import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import NotificationsNoneIcon from '@material-ui/icons/NotificationsNone';
import { Button } from '../components';
import { ReminderContactModal } from '../components/ReminderContactModal';
import { useAuth } from '../contexts/Auth';

const StyledButton = styled(Button)`
  padding: 11px 10px !important;
`;

export const ReminderContactSection = () => {
  const patient = useSelector(state => state.patient);
  const [openReminderModal, setOpenReminderModal] = useState(false);
  const { ability } = useAuth();
  const canReadReminderContacts = ability.can('read', 'Patient');

  const handleOpenRemindersModal = useCallback(() => {
    setOpenReminderModal(true);
  }, []);

  const onClose = useCallback(() => {
    setOpenReminderModal(false);
  }, []);

  if (canReadReminderContacts === false) {
    return null;
  }

  return (
    <>
      <StyledButton
        variant="outlined"
        color="primary"
        size="small"
        onClick={handleOpenRemindersModal}
      >
        <NotificationsNoneIcon />
        Reminder contacts
      </StyledButton>
      <ReminderContactModal
        open={openReminderModal}
        onClose={onClose}
        handleOpenRemindersModal={handleOpenRemindersModal}
        patient={patient}
      />
    </>
  );
};
