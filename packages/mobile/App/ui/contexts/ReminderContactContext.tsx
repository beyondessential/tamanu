import { useQuery } from '@tanstack/react-query';
import React, { type ReactNode, createContext, useContext } from 'react';
import { compose } from 'redux';
import { Database } from '~/infra/db';
import type { IPatientContact } from '~/types';
import { withPatient } from '../containers/Patient';
import { patientKeys } from '../hooks/queries/queryKeys';
import type { BaseAppProps } from '../interfaces/BaseAppProps';

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

const Provider = ({ children, selectedPatient }: BaseAppProps & { children: ReactNode }) => {
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

export const ReminderContactProvider = compose(withPatient)(Provider);
