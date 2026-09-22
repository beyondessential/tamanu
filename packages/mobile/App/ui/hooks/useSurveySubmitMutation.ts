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

export interface SurveySubmitVariables {
  patientId: string;
  surveyId: string;
  surveyType: SurveyTypes;
  components: ISurveyScreenComponent[];
  values: GenericFormValues;
}

async function invalidateRelevantQueries(queryClient: QueryClient, patientId: string) {
  await Promise.all([
    // Additional data, registrations, survey responses, encounters, vitals…
    queryClient.invalidateQueries({ queryKey: patientKeys.detail(patientId) }),
    // Recently viewed tiles and patient search
    queryClient.invalidateQueries({ queryKey: patientListKeys.all }),
    // Registration detail and conditions screens
    queryClient.invalidateQueries({ queryKey: registrationKeys.all }),
    // Recent visitors, referral list and encounter summary reports
    queryClient.invalidateQueries({ queryKey: reportKeys.all }),
  ]);
}

export default function useSurveySubmitMutation(): UseMutationResult<
  { id: string } | null,
  Error,
  SurveySubmitVariables
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
    }: SurveySubmitVariables): Promise<{ id: string } | null> => {
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
      void invalidateRelevantQueries(queryClient, patientId);
      if (selectedPatientId !== patientId) return;
      const patient = await Patient.findOne({ where: { id: patientId } });
      if (patient) dispatch(actions.setSelectedPatient(patient));
    },
  });
}
