import { type QueryClient, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { Patient } from '~/models/Patient';
import type { Referral } from '~/models/Referral';
import type { SurveyResponse } from '~/models/SurveyResponse';
import { type GenericFormValues, type ISurveyScreenComponent, SurveyTypes } from '~/types';
import { authUserSelector } from '~/ui/helpers/selectors';
import { useBackend } from '~/ui/hooks';
import type { ReduxStoreProps } from '~/ui/interfaces/ReduxStoreProps';
import { actions } from '~/ui/store/ducks/patient';
import { patientKeys, patientListKeys, registrationKeys, reportKeys } from './queries/queryKeys';

export interface SurveySubmitVariables {
  patientId: string;
  surveyId: string;
  components: ISurveyScreenComponent[];
  values: GenericFormValues;
}

type SurveySubmitResult<T extends SurveyTypes> = T extends typeof SurveyTypes.Referral
  ? Referral
  : SurveyResponse;

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

export default function useSurveySubmitMutation<T extends SurveyTypes>({
  surveyType,
}: {
  surveyType: T;
}) {
  const { models } = useBackend();
  const user = useSelector(authUserSelector);
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const selectedPatientId = useSelector(
    (state: ReduxStoreProps) => state.patient.selectedPatient?.id,
  );

  return useMutation<SurveySubmitResult<T> | null, Error, SurveySubmitVariables>({
    mutationFn: async ({ patientId, surveyId, components, values }) => {
      const model = surveyType === SurveyTypes.Referral ? models.Referral : models.SurveyResponse;
      const response = await model.submit(
        patientId,
        user.id,
        { surveyId, components, surveyType, encounterReason: 'Form response' },
        values,
      );
      return response as SurveySubmitResult<T> | null;
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
