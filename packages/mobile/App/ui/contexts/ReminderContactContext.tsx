import React, { type ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Database } from '~/infra/db';
import { patientKeys } from '../hooks/queries/queryKeys';
import type { IPatientContact } from '~/types';
import { compose } from 'redux';
import { withPatient } from '../containers/Patient';
import type { BaseAppProps } from '../interfaces/BaseAppProps';
import { useSocket } from '../hooks/useSocket';
import { PatientContact } from '~/models/PatientContact';
import { WS_EVENTS } from '~/constants/webSocket';

interface ReminderContactData {
  reminderContactList: IPatientContact[];
  isLoadingReminderContactList: boolean;
  afterAddContact: (contact: IPatientContact, addedNew?: boolean) => void;
  isFailedContact: (contact: IPatientContact) => boolean;
}

const ReminderContactContext = createContext<ReminderContactData>({
  reminderContactList: [],
  isLoadingReminderContactList: false,
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
  const queryClient = useQueryClient();
  const [pendingContactList, setPendingContactList] = useState<string[]>([]);
  const { data: reminderContactList = [], isPending: isLoading } = useQuery({
    queryKey: patientKeys.contacts(selectedPatient.id),
    queryFn: () => getAllContacts(Database.models, selectedPatient.id),
  });

  useEffect(
    function listenToSubscribeEvents() {
      if (!socket) return;
      const handleTelegramSubscribe = async data => {
        const contact = await PatientContact.findOne({
          where: { id: data.contactId },
          relations: ['patient'],
        });
        if (!contact) return;
        const connectionDetails = JSON.stringify({ chatId: data.chatId });
        await PatientContact.updateValues(contact.id, {
          connectionDetails,
        });
        queryClient.invalidateQueries({ queryKey: patientKeys.contacts(selectedPatient.id) });
      };

      socket.on(WS_EVENTS.TELEGRAM_SUBSCRIBE, handleTelegramSubscribe);
      return () => void socket.off(WS_EVENTS.TELEGRAM_SUBSCRIBE, handleTelegramSubscribe);
    },
    [selectedPatient.id, queryClient, socket],
  );

  useEffect(
    function listenToUnsubscribeEvents() {
      if (!socket) return;
      const handleTelegramUnsubscribe = async data => {
        const contact = await PatientContact.findOne({
          where: { id: data.contactId },
        });
        if (!contact) return;
        await PatientContact.updateValues(contact.id, { deletedAt: new Date() });
        queryClient.invalidateQueries({ queryKey: patientKeys.contacts(selectedPatient.id) });
      };

      socket.on(WS_EVENTS.TELEGRAM_UNSUBSCRIBE, handleTelegramUnsubscribe);
      return () => void socket.off(WS_EVENTS.TELEGRAM_UNSUBSCRIBE, handleTelegramUnsubscribe);
    },
    [selectedPatient.id, queryClient, socket],
  );

  const afterAddContact = (contact: IPatientContact, addedNew?: boolean) => {
    if (addedNew) {
      socket.emit(WS_EVENTS.PATIENT_CONTACT_INSERT, contact);
    }
    setTimeout(() => {
      setPendingContactList(prev => prev.filter(id => id !== contact.id));
    }, DEFAULT_CONTACT_TIMEOUT);
    setPendingContactList([...pendingContactList, contact.id]);
  };

  const isFailedContact = (contact: IPatientContact) => {
    return !contact.connectionDetails && !pendingContactList.includes(contact.id);
  };

  return (
    <ReminderContactContext.Provider
      value={{
        reminderContactList,
        isLoadingReminderContactList: isLoading,
        afterAddContact,
        isFailedContact,
      }}
    >
      {children}
    </ReminderContactContext.Provider>
  );
};

export const ReminderContactProvider = compose(withPatient)(Provider);
