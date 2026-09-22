import { type QueryClient, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Patient } from '~/models/Patient';
import type { ReduxStoreProps } from '~/ui/interfaces/ReduxStoreProps';
import { actions } from '~/ui/store/ducks/patient';
import { patientKeys, patientListKeys, registrationKeys, reportKeys } from './queries/queryKeys';

/** @internal Exported only for testing */
export const invalidateAfterSurveySubmit = async (
  queryClient: QueryClient,
  patientId: string,
): Promise<void> => {
  await Promise.all([
    // Additional data, registrations, survey responses, encounters, vitals… all key off this prefix
    queryClient.invalidateQueries({ queryKey: patientKeys.detail(patientId) }),
    // Recently viewed tiles and patient search render patient columns the form may have written
    queryClient.invalidateQueries({ queryKey: patientListKeys.all }),
    // Registration detail and conditions screens
    queryClient.invalidateQueries({ queryKey: registrationKeys.all }),
    // Recent visitors, referral list and encounter summary reports
    queryClient.invalidateQueries({ queryKey: reportKeys.all }),
  ]);
};

/**
 * Returns a function to call once a survey submission has succeeded. Besides invalidating the
 * affected queries, it reloads the selected patient into the store, since the patient header and
 * details screens render from the store rather than from a query.
 */
export const useAfterSurveySubmit = (): ((patientId: string) => Promise<void>) => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const selectedPatientId = useSelector(
    (state: ReduxStoreProps) => state.patient.selectedPatient?.id,
  );

  return useCallback(
    async (patientId: string) => {
      invalidateAfterSurveySubmit(queryClient, patientId);

      if (selectedPatientId !== patientId) return;
      const patient = await Patient.findOne({ where: { id: patientId } });
      if (patient) dispatch(actions.setSelectedPatient(patient));
    },
    [queryClient, dispatch, selectedPatientId],
  );
};
