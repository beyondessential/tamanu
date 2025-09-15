import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useBackendEffect } from '../hooks';
import { IPatientContact } from '~/types';
import { compose } from 'redux';
import { withPatient } from '../containers/Patient';
import { BaseAppProps } from '../interfaces/BaseAppProps';
import { useSocket } from '../hooks/useSocket';
import { PatientContact } from '~/models/PatientContact';
import { WS_EVENTS } from '~/constants/webSocket';

interface ReminderContactData {
  reminderContactList: IPatientContact[];
  isLoadingReminderContactList: boolean;
  fetchReminderContactList: () => void;
  afterAddContact: (contact: IPatientContact, addedNew?: boolean) => void;
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
    socket.on(WS_EVENTS.TELEGRAM_SUBSCRIBE, handleTelegramSubscribe);
    socket.on(WS_EVENTS.TELEGRAM_UNSUBSCRIBE, handleTelegramUnsubscribe);
    return () => {
      socket.off(WS_EVENTS.TELEGRAM_SUBSCRIBE, handleTelegramSubscribe);
      socket.off(WS_EVENTS.TELEGRAM_UNSUBSCRIBE, handleTelegramUnsubscribe);
    };
  }, [handleTelegramSubscribe, handleTelegramUnsubscribe, socket]);

  const handleTelegramSubscribe = useCallback(async data => {
    const contact = await PatientContact.findOne({
      where: { id: data.contactId },
      relations: ['patient'],
    });
    if (!contact) return;

    const connectionDetails = JSON.stringify({ chatId: data.chatId });
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
  }, []);

  const handleTelegramUnsubscribe = useCallback(async data => {
    const contact = await PatientContact.findOne({
      where: { id: data.contactId },
    });
    if (!contact) return;

    await PatientContact.updateValues(contact.id, {
      deletedAt: new Date(),
    });

    setReminderContactList(prev => prev.filter(c => c.id !== contact.id));
  }, []);

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
