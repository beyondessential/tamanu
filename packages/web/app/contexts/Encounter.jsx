import React, { createContext, useContext, useMemo } from 'react';
import { generatePath, Navigate } from 'react-router';
import { PATIENT_PATHS } from '../constants/patientPaths';
import { useEncounterQuery } from '../api/queries/useEncounterQuery';
import { useRouteParams } from '../utils/useRouteParams';

const EncounterContext = createContext(null);

export const useEncounter = () => {
  const context = useContext(EncounterContext);
  if (!context) {
    throw new Error('useEncounter must be used within an EncounterProvider');
  }
  return context;
};

// A 404 or 403 means this encounter will never be viewable by this user, so there is nothing to
// show and nothing worth retrying. Every other failure — a 500, a timeout, an offline moment —
// might not recur, and must not move the clinician off the encounter they asked for.
const isUnviewable = error => error?.status === 404 || error?.status === 403;

// Owns "load the encounter for the current route": the `:encounterId` in the URL is the single
// source of truth, so navigating is the only way to change which encounter is on screen, and
// back/forward, refresh and deep links all resolve without any state to reconcile.
export const EncounterProvider = ({ children }) => {
  const { encounterId } = useRouteParams(PATIENT_PATHS.ENCOUNTER);
  const patientParams = useRouteParams(PATIENT_PATHS.PATIENT);
  const { data: encounter, isLoading, error, refetch } = useEncounterQuery(encounterId);

  const value = useMemo(
    () => ({
      encounterId,
      encounter: encounter ?? null,
      // A disabled query reports as loading, so off an encounter route there's nothing to wait for.
      isLoadingEncounter: Boolean(encounterId) && isLoading,
      error: isUnviewable(error) ? null : error,
      refetch,
    }),
    [encounterId, encounter, isLoading, error, refetch],
  );

  // An encounter this user can never view has nothing to show, so fall back to the patient it was
  // reached through. Everything else stays put and surfaces through `error`.
  if (isUnviewable(error)) {
    return <Navigate to={generatePath(PATIENT_PATHS.PATIENT, patientParams)} replace />;
  }

  return <EncounterContext.Provider value={value}>{children}</EncounterContext.Provider>;
};
