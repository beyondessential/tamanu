import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUserPreferencesQuery } from '../api/queries';

const OutpatientAppointmentsContext = createContext(null);

export const OUTPATIENT_APPOINTMENTS_EMPTY_FILTER_STATE = {
  appointmentTypeId: [],
  locationGroupId: [],
  patientNameOrId: null,
};

export const OutpatientAppointmentsContextProvider = ({ children }) => {
  const { data: userPreferences } = useUserPreferencesQuery();
  const [filters, setFilters] = useState(OUTPATIENT_APPOINTMENTS_EMPTY_FILTER_STATE);

  useEffect(() => {
    if (userPreferences?.outpatientAppointmentFilters) {
      setFilters(userPreferences?.outpatientAppointmentFilters);
    }
  }, [userPreferences]);

  return (
    <OutpatientAppointmentsContext.Provider value={{ filters, setFilters }}>
      {children}
    </OutpatientAppointmentsContext.Provider>
  );
};

export const useOutpatientAppointmentsContext = () => {
  const context = useContext(OutpatientAppointmentsContext);
  if (context === null)
    throw new Error(
      'OutpatientAppointmentsContextProvider’s value is null. This probably means useOutpatientAppointmentsContext has been called outside a OutpatientAppointmentsContextProvider.',
    );
  return context;
};
