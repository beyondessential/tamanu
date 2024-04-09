import React, { useState } from 'react';
import styled from 'styled-components';

import { Box } from '@material-ui/core';

import { AddReminderContact } from './AddReminderContact';
import { BaseModal } from './BaseModal';
import { ReminderContactList } from './ReminderContactList';
import { ReminderContactQR } from './ReminderContactQR';
import { RemoveReminderContact } from './RemoveReminderContact';
import { useTranslation } from '../contexts/Translation';

const ReminderModalContainer = styled(Box)`
  padding: 0px 8px
`;

const StyledBaseModal = styled(BaseModal)`
  .MuiPaper-root {
    max-width: 673px;
  }
  .MuiDialogTitle-root {
    padding-left: 40px;
    padding-top: 8px;
    padding-bottom: 8px;
  }
`

const REMINDER_CONTACT_VIEWS = {
  REMINDER_CONTACT_LIST: 'ReminderContactList',
  ADD_REMINDER_FORM: 'AddReminderForm',
  ADD_REMINDER_QR_CODE: 'AddReminderQrCode',
  REMOVE_REMINDER: 'RemoveReminder',
};

export const ReminderContactModal = ({ onClose, open }) => {
  const { getTranslation } = useTranslation();
  const [activeView, setActiveView] = useState(REMINDER_CONTACT_VIEWS.REMINDER_CONTACT_LIST);

  const handleActiveView = value => {
    setActiveView(value);
  };

  const getModalTitle = () => {
    switch (activeView) {
      case REMINDER_CONTACT_VIEWS.REMINDER_CONTACT_LIST:
        return getTranslation('patient.details.reminderContacts.title', 'Reminder contacts');
      case REMINDER_CONTACT_VIEWS.ADD_REMINDER_FORM:
        return getTranslation('patient.details.addReminderContacts.title', 'Add reminder contact');
      case REMINDER_CONTACT_VIEWS.ADD_REMINDER_QR_CODE:
        return getTranslation('patient.details.addReminderContacts.title', 'Add reminder contact');
      case REMINDER_CONTACT_VIEWS.REMOVE_REMINDER:
        return getTranslation(
          'patient.details.removeReminderContacts.title',
          'Remove reminder contact',
        );
    }
  };

  const onContinue = async data => {
    handleActiveView(REMINDER_CONTACT_VIEWS.ADD_REMINDER_QR_CODE);
    await console.log(data);
  };

  const onBack = () => {
    handleActiveView(REMINDER_CONTACT_VIEWS.REMINDER_CONTACT_LIST);
  };

  return (
    <StyledBaseModal
      width={activeView === REMINDER_CONTACT_VIEWS.REMOVE_REMINDER ? 'sm' : 'md'}
      title={getModalTitle()}
      open={open}
      onClose={onClose}
    >
      <ReminderModalContainer>
        {activeView === REMINDER_CONTACT_VIEWS.REMINDER_CONTACT_LIST && (
          <ReminderContactList
            onAddContact={() => handleActiveView(REMINDER_CONTACT_VIEWS.ADD_REMINDER_FORM)}
            onClose={onClose}
          />
        )}
        {activeView === REMINDER_CONTACT_VIEWS.ADD_REMINDER_FORM && (
          <AddReminderContact
            onContinue={onContinue}
            onBack={onBack}
            onClose={onClose}
          />
        )}
        {activeView === REMINDER_CONTACT_VIEWS.ADD_REMINDER_QR_CODE && (
          <ReminderContactQR onClose={onClose} />
        )}
        {activeView === REMINDER_CONTACT_VIEWS.REMOVE_REMINDER && (
          <RemoveReminderContact onClose={onClose} onBack={onBack} />
        )}
      </ReminderModalContainer>
    </StyledBaseModal>
  );
};
