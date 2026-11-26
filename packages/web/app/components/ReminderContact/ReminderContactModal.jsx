import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import { BaseModal, useTranslation } from '@tamanu/ui-components';
import { ReminderContactList } from './ReminderContactList';
import { RemoveReminderContact } from './RemoveReminderContact';

const ReminderModalContainer = styled.div`
  padding: 0px 8px;
`;

const StyledBaseModal = styled(BaseModal)`
  .MuiPaper-root {
    max-width: 750px;
  }
  .MuiDialogTitle-root {
    padding-left: 40px;
    padding-top: 8px;
    padding-bottom: 8px;
  }
`;

const REMINDER_CONTACT_VIEWS = {
  REMINDER_CONTACT_LIST: 'ReminderContactList',
  REMOVE_REMINDER: 'RemoveReminder',
};

export const ReminderContactModal = ({ onClose, open }) => {
  const { getTranslation } = useTranslation();
  const [activeView, setActiveView] = useState(REMINDER_CONTACT_VIEWS.REMINDER_CONTACT_LIST);
  const [selectedContact, setSelectedContact] = useState();

  useEffect(() => {
    setActiveView(REMINDER_CONTACT_VIEWS.REMINDER_CONTACT_LIST);
  }, [open]);

  const handleActiveView = value => {
    setActiveView(value);
  };

  const getModalTitle = () => {
    switch (activeView) {
      case REMINDER_CONTACT_VIEWS.REMINDER_CONTACT_LIST:
        return getTranslation('patient.details.reminderContacts.title', 'Reminder contacts');
      case REMINDER_CONTACT_VIEWS.REMOVE_REMINDER:
        return getTranslation(
          'patient.details.removeReminderContact.title',
          'Remove reminder contact?',
        );
    }
  };

  const onBack = () => {
    handleActiveView(REMINDER_CONTACT_VIEWS.REMINDER_CONTACT_LIST);
  };

  const handleRemoveContact = contact => {
    setSelectedContact(contact);
    handleActiveView(REMINDER_CONTACT_VIEWS.REMOVE_REMINDER);
  };

  return (
    <StyledBaseModal
      width={activeView === REMINDER_CONTACT_VIEWS.REMOVE_REMINDER ? 'sm' : 'md'}
      title={getModalTitle()}
      open={open}
      onClose={onClose}
      data-testid="styledbasemodal-y16p"
    >
      <ReminderModalContainer data-testid="remindermodalcontainer-3k3b">
        {activeView === REMINDER_CONTACT_VIEWS.REMINDER_CONTACT_LIST && (
          <ReminderContactList
            onRemoveContact={handleRemoveContact}
            onClose={onClose}
            data-testid="remindercontactlist-og9g"
          />
        )}
        {activeView === REMINDER_CONTACT_VIEWS.REMOVE_REMINDER && (
          <RemoveReminderContact
            selectedContact={selectedContact}
            onClose={onClose}
            onBack={onBack}
            data-testid="removeremindercontact-ru7m"
          />
        )}
      </ReminderModalContainer>
    </StyledBaseModal>
  );
};
