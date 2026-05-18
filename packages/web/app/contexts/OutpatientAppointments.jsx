import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { debounce, omit } from 'lodash';
import { useLocation } from 'react-router';

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
  const { data: userPreferences, isLoading } = useUserPreferencesQuery();
  const { facilityId } = useAuth();
  const { mutate } = useUserPreferencesMutation(facilityId);
  const location = useLocation();
  const defaultGroupBy =
    new URLSearchParams(location.search).get('groupBy') || APPOINTMENT_GROUP_BY.LOCATION_GROUP;

  const [locationGroupFilters, setLocationGroupFilters] = useState(
    OUTPATIENT_APPOINTMENTS_EMPTY_FILTER_STATE,
  );
  const [clinicianFilters, setClinicianFilters] = useState(
    OUTPATIENT_APPOINTMENTS_EMPTY_FILTER_STATE,
  );
  const [groupBy, setGroupBy] = useState(null);
  const [hasLoadedPreferences, setHasLoadedPreferences] = useState(false);

  // Load saved preferences exactly once after the query completes
  useEffect(() => {
    if (isLoading || hasLoadedPreferences) return;
    setHasLoadedPreferences(true);

    setGroupBy(userPreferences?.outpatientAppointmentGroupBy ?? defaultGroupBy);

    const saved = userPreferences?.outpatientAppointmentFilters;
    if (saved) {
      const isNewFormat =
        APPOINTMENT_GROUP_BY.LOCATION_GROUP in saved || APPOINTMENT_GROUP_BY.CLINICIAN in saved;
      if (isNewFormat) {
        if (saved[APPOINTMENT_GROUP_BY.LOCATION_GROUP]) {
          setLocationGroupFilters(prev => ({
            ...prev,
            ...saved[APPOINTMENT_GROUP_BY.LOCATION_GROUP],
          }));
        }
        if (saved[APPOINTMENT_GROUP_BY.CLINICIAN]) {
          setClinicianFilters(prev => ({ ...prev, ...saved[APPOINTMENT_GROUP_BY.CLINICIAN] }));
        }
      } else {
        // Legacy flat format — treat as locationGroup filters
        setLocationGroupFilters(prev => ({ ...prev, ...saved }));
      }
    }
  }, [isLoading, hasLoadedPreferences, userPreferences, defaultGroupBy]);

  // Persist both filter sets whenever either changes (debounced, skips during init)
  const debouncedSaveFilters = useMemo(
    () =>
      debounce(
        (lgFilters, cFilters) =>
          mutate({
            key: USER_PREFERENCES_KEYS.OUTPATIENT_APPOINTMENT_FILTERS,
            value: {
              [APPOINTMENT_GROUP_BY.LOCATION_GROUP]: omit(lgFilters, ['patientNameOrId']),
              [APPOINTMENT_GROUP_BY.CLINICIAN]: omit(cFilters, ['patientNameOrId']),
            },
          }),
        300,
      ),
    [mutate],
  );

  useEffect(() => {
    if (!hasLoadedPreferences) return;
    debouncedSaveFilters(locationGroupFilters, clinicianFilters);
  }, [locationGroupFilters, clinicianFilters, hasLoadedPreferences, debouncedSaveFilters]);

  // Persist groupBy whenever it changes (skips during init)
  useEffect(() => {
    if (!hasLoadedPreferences || !groupBy) return;
    mutate({ key: USER_PREFERENCES_KEYS.OUTPATIENT_APPOINTMENT_GROUP_BY, value: groupBy });
  }, [groupBy, hasLoadedPreferences, mutate]);

  // Derive the active filters and setter for the current group
  const filters =
    groupBy === APPOINTMENT_GROUP_BY.CLINICIAN ? clinicianFilters : locationGroupFilters;
  const setFilters = useCallback(
    newFilters => {
      if (groupBy === APPOINTMENT_GROUP_BY.CLINICIAN) {
        setClinicianFilters(newFilters);
      } else {
        setLocationGroupFilters(newFilters);
      }
    },
    [groupBy],
  );

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
