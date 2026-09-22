import {
  type QueryClient,
  useMutation,
  type UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { Patient } from '~/models/Patient';
import { type GenericFormValues, type ISurveyScreenComponent, SurveyTypes } from '~/types';
import { authUserSelector } from '~/ui/helpers/selectors';
import { useBackend } from '~/ui/hooks';
import type { ReduxStoreProps } from '~/ui/interfaces/ReduxStoreProps';
import { actions } from '~/ui/store/ducks/patient';
import { patientKeys, patientListKeys, registrationKeys, reportKeys } from './queries/queryKeys';

export interface SubmitSurveyVariables {
  patientId: string;
  surveyId: string;
  surveyType: SurveyTypes;
  components: ISurveyScreenComponent[];
  values: GenericFormValues;
}

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
 * Submits a survey (or referral) response for a patient. Every survey submission goes through
 * this mutation so that the follow-up is not something each form has to remember: a survey may
 * write patient fields, so besides invalidating the affected queries the selected patient is
 * reloaded into the store, since the patient header and details screens render from the store
 * rather than from a query.
 */
export default function useSurveySubmitMutation(): UseMutationResult<
  { id: string } | null,
  Error,
  SubmitSurveyVariables
> {
  const { models } = useBackend();
  const user = useSelector(authUserSelector);
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const selectedPatientId = useSelector(
    (state: ReduxStoreProps) => state.patient.selectedPatient?.id,
  );

  return useMutation({
    // Referral.submit and SurveyResponse.submit return different record types; callers only
    // rely on the shared id field.
    mutationFn: ({
      patientId,
      surveyId,
      surveyType,
      components,
      values,
    }: SubmitSurveyVariables): Promise<{ id: string } | null> => {
      const model = surveyType === SurveyTypes.Referral ? models.Referral : models.SurveyResponse;
      return model.submit(
        patientId,
        user.id,
        { surveyId, components, surveyType, encounterReason: 'Form response' },
        values,
      );
    },
    onSuccess: async (response, { patientId }) => {
      if (!response) return;
      void invalidateAfterSurveySubmit(queryClient, patientId);
      if (selectedPatientId !== patientId) return;
      const patient = await Patient.findOne({ where: { id: patientId } });
      if (patient) dispatch(actions.setSelectedPatient(patient));
    },
  });
}
