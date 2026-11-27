import { useQuery } from '@tanstack/react-query';
import React, { type ReactNode, createContext, useContext } from 'react';
import { Database } from '~/infra/db';
import type { IPatientContact } from '~/types';
import { useSelectedPatient } from '~/ui/contexts/SelectedPatientContext';
import { patientKeys } from '../hooks/queries/queryKeys';

interface ReminderContactData {
  reminderContactList: IPatientContact[];
  isLoadingReminderContactList: boolean;
}

const ReminderContactContext = createContext<ReminderContactData>({
  reminderContactList: [],
  isLoadingReminderContactList: false,
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

export const ReminderContactProvider = ({ children }: { children: ReactNode }) => {
  const { selectedPatient } = useSelectedPatient();
  const { data: reminderContactList = [], isPending: isLoading } = useQuery({
    queryKey: patientKeys.contacts(selectedPatient.id),
    queryFn: () => getAllContacts(Database.models, selectedPatient.id),
  });

  return (
    <ReminderContactContext.Provider
      value={{
        reminderContactList,
        isLoadingReminderContactList: isLoading,
      }}
    >
      {children}
    </ReminderContactContext.Provider>
  );
};
