import React, { useState } from 'react';
import styled from 'styled-components';

import { Box } from '@material-ui/core';

import { AddReminderContact } from './AddReminderContact';
import { BaseModal } from './BaseModal';
import { ReminderContactList } from './ReminderContactList';
import { ReminderContactQR } from './ReminderContactQR';
import { RemoveReminderContact } from './RemoveReminderContact';

const ReminderModalContainer = styled(Box)`
  margin: 0 8px;
`;

const REMINDER_CONTACT_VIEWS = {
  REMINDER_CONTACT_LIST: 'ReminderContactList',
  ADD_REMINDER_FORM: 'AddReminderForm',
  ADD_REMINDER_QR_CODE: 'AddReminderQrCode',
  REMOVE_REMINDER: 'RemoveReminder',
};

const REMINDER_CONTACT_MODAL_TITLE = {
  REMINDER_CONTACT_LIST: 'Reminder contacts',
  ADD_REMINDER_FORM: 'Add reminder contact',
  ADD_REMINDER_QR_CODE: 'Add reminder contact',
  REMOVE_REMINDER: 'Remove reminder contact',
};

export const ReminderContactModal = ({ patient, onClose, open }) => {
  const [activeView, setActiveView] = useState(REMINDER_CONTACT_VIEWS.REMINDER_CONTACT_LIST);

  const handleActiveView = value => {
    setActiveView(value);
  };

  const getModalTitle = () => {
    switch (activeView) {
      case REMINDER_CONTACT_VIEWS.REMINDER_CONTACT_LIST:
        return REMINDER_CONTACT_MODAL_TITLE.REMINDER_CONTACT_LIST;
      case REMINDER_CONTACT_VIEWS.ADD_REMINDER_FORM:
        return REMINDER_CONTACT_MODAL_TITLE.ADD_REMINDER_FORM;
      case REMINDER_CONTACT_VIEWS.ADD_REMINDER_QR_CODE:
        return REMINDER_CONTACT_MODAL_TITLE.ADD_REMINDER_QR_CODE;
      case REMINDER_CONTACT_VIEWS.REMOVE_REMINDER:
        return REMINDER_CONTACT_MODAL_TITLE.REMOVE_REMINDER;
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
    <BaseModal
      width={activeView === REMINDER_CONTACT_VIEWS.REMOVE_REMINDER ? 'sm' : 'md'}
      title={getModalTitle()}
      open={open}
      onClose={onClose}
    >
      <ReminderModalContainer>
        {activeView === REMINDER_CONTACT_VIEWS.REMINDER_CONTACT_LIST && (
          <ReminderContactList
            patient={patient}
            onAddContact={() => handleActiveView(REMINDER_CONTACT_VIEWS.ADD_REMINDER_FORM)}
            onClose={onClose}
          />
        )}
        {activeView === REMINDER_CONTACT_VIEWS.ADD_REMINDER_FORM && (
          <AddReminderContact
            patient={patient}
            onContinue={onContinue}
            onBack={onBack}
            onClose={onClose}
          />
        )}
        {activeView === REMINDER_CONTACT_VIEWS.ADD_REMINDER_QR_CODE && (
          <ReminderContactQR patient={patient} onClose={onClose} />
        )}
        {activeView === REMINDER_CONTACT_VIEWS.REMOVE_REMINDER && (
          <RemoveReminderContact onClose={onClose} onBack={onBack} />
        )}
      </ReminderModalContainer>
    </BaseModal>
  );
};
