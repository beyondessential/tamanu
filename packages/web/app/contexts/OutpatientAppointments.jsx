import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import { omit } from 'lodash';

import { USER_PREFERENCES_KEYS } from '@tamanu/constants';
import { useUserPreferencesQuery } from '../api/queries';
import { useUserPreferencesMutation } from '../api/mutations';
import { useAuth } from './Auth';
import { APPOINTMENT_GROUP_BY } from '../views/scheduling/outpatientBookings/OutpatientAppointmentsView';

const OutpatientAppointmentsContext = createContext(null);

export const OUTPATIENT_APPOINTMENTS_EMPTY_FILTER_STATE = {
  appointmentTypeId: [],
  locationGroupId: [],
  clinicianId: [],
  patientNameOrId: null,
};

export const OutpatientAppointmentsContextProvider = ({ children }) => {
  const { facilityId } = useAuth();
  const { data: userPreferences, isLoading } = useUserPreferencesQuery();
  const { mutate: mutateUserPreferences } = useUserPreferencesMutation(facilityId);
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
    } else if (!isLoading && !userPreferences && !hasLoadedPreferences.current) {
      setGroupBy(defaultGroupBy);
      hasLoadedPreferences.current = true;
    }
  }, [userPreferences, isLoading, defaultGroupBy]);

  const setGroupByWithPersist = useCallback(
    newGroupBy => {
      setGroupBy(newGroupBy);
      if (hasLoadedPreferences.current) {
        mutateUserPreferences({
          key: USER_PREFERENCES_KEYS.OUTPATIENT_APPOINTMENT_GROUP_BY,
          value: newGroupBy,
        });
      }
    },
    [mutateUserPreferences],
  );

  const setFiltersWithPersist = useCallback(
    newFilters => {
      setFilters(newFilters);
      if (hasLoadedPreferences.current) {
        mutateUserPreferences({
          key: USER_PREFERENCES_KEYS.OUTPATIENT_APPOINTMENT_FILTERS,
          value: omit(newFilters, ['patientNameOrId']),
        });
      }
    },
    [mutateUserPreferences],
  );

  return (
    <OutpatientAppointmentsContext.Provider
      value={{ filters, setFilters: setFiltersWithPersist, groupBy, setGroupBy: setGroupByWithPersist }}
    >
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
