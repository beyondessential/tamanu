import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

import { Box } from '@material-ui/core';

import { REMINDER_CONTACT_MODAL_TITLE, REMINDER_CONTACT_VIEWS } from '../constants';
import { AddReminderContactContainer } from './AddReminderContactContainer';
import { AddReminderQrCodeContainer } from './AddReminderQrCodeContainer';
import { BaseModal } from './BaseModal';
import { ReminderContactListContainer } from './ReminderContactListContainer';

const ReminderModalContainer = styled(Box)`
  margin: 0 8px;
`;

export const ReminderContactModal = ({ patient, handleCloseRemindersModal }) => {
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

  return (
    <BaseModal width="md" title={getModalTitle()} open onClose={handleCloseRemindersModal}>
      <ReminderModalContainer>
        {activeView === REMINDER_CONTACT_VIEWS.REMINDER_CONTACT_LIST && (
          <ReminderContactListContainer
            patient={patient}
            handleActiveView={handleActiveView}
            handleCloseRemindersModal={handleCloseRemindersModal}
          />
        )}
        {activeView === REMINDER_CONTACT_VIEWS.ADD_REMINDER_FORM && (
          <AddReminderContactContainer
            patient={patient}
            handleActiveView={handleActiveView}
            handleCloseRemindersModal={handleCloseRemindersModal}
          />
        )}
        {activeView === REMINDER_CONTACT_VIEWS.ADD_REMINDER_QR_CODE && (
          <AddReminderQrCodeContainer
            patient={patient}
            handleCloseRemindersModal={handleCloseRemindersModal}
          />
        )}
      </ReminderModalContainer>
    </BaseModal>
  );
};
