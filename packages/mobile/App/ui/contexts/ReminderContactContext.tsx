import { useQuery } from '@tanstack/react-query';
import React, { type ReactNode, createContext, useContext } from 'react';
import { compose } from 'redux';
import { WS_EVENTS } from '~/constants/webSocket';
import { Database } from '~/infra/db';
import type { IPatientContact } from '~/types';
import { withPatient } from '../containers/Patient';
import { patientKeys } from '../hooks/queries/queryKeys';
import { useBackend } from '../hooks';
import { useSocket } from '../hooks/useSocket';
import { wakeCentral } from '../helpers/wakeCentral';
import type { BaseAppProps } from '../interfaces/BaseAppProps';

interface ReminderContactData {
  reminderContactList: IPatientContact[];
  isLoadingReminderContactList: boolean;
  afterAddContact: (contact: IPatientContact) => void;
}

const ReminderContactContext = createContext<ReminderContactData>({
  reminderContactList: [],
  isLoadingReminderContactList: false,
  afterAddContact: () => undefined,
});

export const useReminderContact = () => useContext(ReminderContactContext);

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
    relations: ['relationship'],
  });
};

const Provider = ({ children, selectedPatient }: BaseAppProps & { children: ReactNode }) => {
  const { socket } = useSocket();
  const { centralServer } = useBackend();
  const { data: reminderContactList = [], isPending: isLoading } = useQuery({
    queryKey: patientKeys.contacts(selectedPatient.id),
    queryFn: () => getAllContacts(Database.models, selectedPatient.id),
  });

  const afterAddContact = (contact: IPatientContact) => {
    // Nothing here waits on central, which may take a while to wake
    wakeCentral(centralServer).then(() => socket.emit(WS_EVENTS.PATIENT_CONTACT_INSERT, contact));
  };

  return (
    <ReminderContactContext.Provider
      value={{
        reminderContactList,
        isLoadingReminderContactList: isLoading,
        afterAddContact,
      }}
    >
      {children}
    </ReminderContactContext.Provider>
  );
};

export const ReminderContactProvider = compose(withPatient)(Provider);
