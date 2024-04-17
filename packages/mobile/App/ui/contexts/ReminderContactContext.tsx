import React, { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { useBackendEffect } from '../hooks';
import { IPatientContact } from '~/types';
import { compose } from 'redux';
import { withPatient } from '../containers/Patient';
import { BaseAppProps } from '../interfaces/BaseAppProps';
import { useSocket } from '../hooks/useSocket';
import { PatientContact } from '~/models/PatientContact';
import { joinNames } from '../helpers/user';
import { useTranslation } from './TranslationContext';

interface ReminderContactData {
  reminderContactList: IPatientContact[];
  isLoadingReminderContactList: boolean;
  fetchReminderContactList: () => void;
  afterAddContact: (contactId: string) => void;
  isFailedContact: (contact: IPatientContact) => boolean;
}

const ReminderContactContext = createContext<ReminderContactData>({
  reminderContactList: [],
  isLoadingReminderContactList: false,
  fetchReminderContactList: () => undefined,
  afterAddContact: () => undefined,
  isFailedContact: () => false,
});

export const useReminderContact = () => useContext(ReminderContactContext);

const DEFAULT_CONTACT_TIMEOUT = 120000; // 2 minutes

const getAllContacts = async (models, patientId): Promise<IPatientContact[]> => {
  return models.PatientContact.find({
    where: {
      patient: {
        id: patientId,
      },
    },
    order: {
      name: 'ASC',
    },
  });
};

const Provider = ({ children, selectedPatient }: BaseAppProps & { children: ReactNode }) => {
  const { getTranslation } = useTranslation();
  const { socket } = useSocket();
  const [pendingContactList, setPendingContactList] = useState<string[]>([]);
  const [reminderContactList, setReminderContactList] = useState<IPatientContact[]>([]);
  const [data, _, isLoading, refetch] = useBackendEffect(
    ({ models }) => getAllContacts(models, selectedPatient.id),
    [],
  );

  useEffect(() => {
    setReminderContactList(data || []);
  }, [data]);

  useEffect(() => {
    if (!socket) return;
    socket.on('telegram:subscribe', async ({ chatId, contactId, botInfo }) => {
      const contact = await PatientContact.findOne({
        where: { id: contactId },
        relations: ['patient'],
      });
      if (!contact) return;

      const connectionDetails = JSON.stringify({ chatId });
      await PatientContact.updateValues(contact.id, {
        connectionDetails,
      });

      setReminderContactList(prev =>
        prev.map(c => {
          if (c.id === contact.id) {
            return { ...c, connectionDetails };
          }
          return c;
        }),
      );

      const contactName = contact.name;
      const patientName = joinNames(contact.patient);

      const successMessage = getTranslation(
        'telegramRegistration.successMessage',
        `Dear :contactName, you have successfully registered to receive messages for :patientName from :botName. Thank you.
        \nIf you would prefer to not receive future messages from :botName, please select :command`,
        { contactName, patientName, botName: botInfo.first_name, command: '/unsubscribe' },
      );
      socket.emit('telegram:send-message', { chatId, message: successMessage });
    });
  }, [socket]);

  const afterAddContact = (contactId: string) => {
    setTimeout(() => {
      setPendingContactList(prev => prev.filter(id => id !== contactId));
    }, DEFAULT_CONTACT_TIMEOUT);
    setPendingContactList([...pendingContactList, contactId]);
  };

  const isFailedContact = (contact: IPatientContact) => {
    return !contact.connectionDetails && !pendingContactList.includes(contact.id);
  };

  return (
    <ReminderContactContext.Provider
      value={{
        reminderContactList,
        isLoadingReminderContactList: isLoading,
        fetchReminderContactList: refetch,
        afterAddContact,
        isFailedContact,
      }}
    >
      {children}
    </ReminderContactContext.Provider>
  );
};

export const ReminderContactProvider = compose(withPatient)(Provider);
