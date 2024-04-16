import React, { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { useBackendEffect } from '../hooks';
import { IPatientContact } from '~/types';
import { compose } from 'redux';
import { withPatient } from '../containers/Patient';
import { BaseAppProps } from '../interfaces/BaseAppProps';
import { useSocket } from '../hooks/useSocket';
import { PatientContact } from '~/models/PatientContact';
import { joinNames } from '../helpers/user';

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
  const { socket } = useSocket();
  const [pendingContactList, setPendingContactList] = useState<string[]>([]);
  const [patientContacts, setPatientContacts] = useState<IPatientContact[]>([]);
  const [data, _, isLoading, refetch] = useBackendEffect(
    ({ models }) => getAllContacts(models, selectedPatient.id),
    [],
  );

  useEffect(() => {
    setPatientContacts(data || []);
  }, [data]);

  useEffect(() => {
    if (!socket) return;
    socket.on('telegram:subscribe', async data => {
      const contact = await PatientContact.findOne({
        where: { id: data.contactId },
        relations: ['patient'],
      });
      if (!contact) return;

      const connectionDetails = JSON.stringify({ chatId: data.chatId });
      await PatientContact.updateValues(contact.id, {
        connectionDetails,
      });

      setPatientContacts(prev =>
        prev.map(c => {
          if (c.id === contact.id) {
            return { ...c, connectionDetails };
          }
          return c;
        }),
      );

      const contactName = contact.name;
      const patientName = joinNames(contact.patient);

      const successMessage = `Dear ${contactName}, you have successfully registered to receive messages for ${patientName}. Thank you.`;
      socket.emit('telegram:send-message', { chatId: data.chatId, message: successMessage });
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
        reminderContactList: patientContacts,
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
