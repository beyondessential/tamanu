import React, { createContext, useContext, useMemo } from 'react';
import { generatePath, matchPath, Navigate, useLocation } from 'react-router';
import { PATIENT_PATHS } from '../constants/patientPaths';
import { useEncounterQuery } from '../api/queries/useEncounterQuery';

const EncounterContext = createContext(null);

export const useEncounter = () => {
  const context = useContext(EncounterContext);
  if (!context) {
    throw new Error('useEncounter must be used within an EncounterProvider');
  }
  return context;
};

const useRouteParams = path => {
  const { pathname } = useLocation();
  return matchPath({ path, end: false }, pathname)?.params ?? {};
};

// Owns "load the encounter for the current route": the `:encounterId` in the URL is the single
// source of truth, so navigating is the only way to change which encounter is on screen, and
// back/forward, refresh and deep links all resolve without any state to reconcile.
export const EncounterProvider = ({ children }) => {
  const { encounterId } = useRouteParams(PATIENT_PATHS.ENCOUNTER);
  const patientParams = useRouteParams(PATIENT_PATHS.PATIENT);
  const { data: encounter, isLoading, error } = useEncounterQuery(encounterId);

  const value = useMemo(
    () => ({
      encounterId,
      encounter: encounter ?? null,
      // A disabled query reports as loading, so off an encounter route there's nothing to wait for.
      isLoadingEncounter: Boolean(encounterId) && isLoading,
      error,
    }),
    [encounterId, encounter, isLoading, error],
  );

  // An encounter that can't be fetched — deleted, mistyped, or not visible to this user — has no
  // view to show, so fall back to the patient it was reached through.
  if (error) {
    return <Navigate to={generatePath(PATIENT_PATHS.PATIENT, patientParams)} replace />;
  }

  return <EncounterContext.Provider value={value}>{children}</EncounterContext.Provider>;
};
