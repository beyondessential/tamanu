import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';

import { useUserPreferencesQuery } from '../api/queries';
import { APPOINTMENT_GROUP_BY } from '../views/scheduling/outpatientBookings/OutpatientAppointmentsView';

const OutpatientAppointmentsContext = createContext(null);

export const OUTPATIENT_APPOINTMENTS_EMPTY_FILTER_STATE = {
  appointmentTypeId: [],
  locationGroupId: [],
  clinicianId: [],
  patientNameOrId: null,
};

export const OutpatientAppointmentsContextProvider = ({ children }) => {
  const { data: userPreferences } = useUserPreferencesQuery();
  const location = useLocation();
  const defaultGroupBy =
    new URLSearchParams(location.search).get('groupBy') || APPOINTMENT_GROUP_BY.LOCATION_GROUP;
  const [filters, setFilters] = useState(OUTPATIENT_APPOINTMENTS_EMPTY_FILTER_STATE);
  const [groupBy, setGroupBy] = useState(null);
  const hasLoadedPreferences = useRef(false);

  useEffect(() => {
    if (userPreferences && !hasLoadedPreferences.current) {
      if (userPreferences?.outpatientAppointmentGroupBy) {
        setGroupBy(userPreferences.outpatientAppointmentGroupBy);
      } else {
        setGroupBy(defaultGroupBy);
      }
      if (userPreferences?.outpatientAppointmentFilters) {
        setFilters(userPreferences.outpatientAppointmentFilters);
      }
      hasLoadedPreferences.current = true;
    } else if (!userPreferences && !hasLoadedPreferences.current) {
      setGroupBy(defaultGroupBy);
      hasLoadedPreferences.current = true;
    }
  }, [userPreferences, defaultGroupBy]);

  return (
    <OutpatientAppointmentsContext.Provider value={{ filters, setFilters, groupBy, setGroupBy }}>
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
