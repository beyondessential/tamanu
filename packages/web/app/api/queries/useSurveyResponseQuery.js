import { useQuery } from '@tanstack/react-query';
import { cloneDeep } from 'lodash';
import { PROGRAM_DATA_ELEMENT_TYPES } from '@tamanu/constants';
import { usePatientDataDisplayValue } from '@tamanu/ui-components';
import { useApi } from '../useApi';

export const useSurveyResponseQuery = surveyResponseId => {
  const api = useApi();
  return useQuery(
    ['surveyResponse', surveyResponseId],
    () => api.get(`surveyResponse/${surveyResponseId}`),
    { enabled: !!surveyResponseId },
  );
};

export const useTransformedSurveyResponseQuery = surveyResponseId => {
  const { getDisplayValue } = usePatientDataDisplayValue();

  const { data: surveyResponse, ...queryResult } = useSurveyResponseQuery(surveyResponseId);

  return useQuery(
    ['transformedSurveyResponse', surveyResponseId],
    async () => {
      if (!surveyResponse) return null;

      const transformedSurveyResponse = cloneDeep(surveyResponse);
      const answers = transformedSurveyResponse.answers;

      const patientDataPromises = transformedSurveyResponse.answers
        .filter(answer => {
          const component = surveyResponse.components.find(
            component => component.dataElementId === answer.dataElementId,
          );
          return (
            component &&
            (component.dataElement.type === PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA ||
              (component.dataElement.type === PROGRAM_DATA_ELEMENT_TYPES.SURVEY_ANSWER &&
                answer.sourceType === PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA))
          );
        })
        .map(async answer => {
          const component = surveyResponse.components.find(
            component => component.dataElementId === answer.dataElementId,
          );

          const originalConfig = component.config;
          const sourceConfig = answer.sourceConfig;
          const config =
            component.dataElement.type === PROGRAM_DATA_ELEMENT_TYPES.SURVEY_ANSWER
              ? sourceConfig
              : originalConfig;

          const displayValue = await getDisplayValue({
            value: answer.originalBody,
            config: config ? JSON.parse(config) : {},
          });
          return {
            dataElementId: answer.dataElementId,
            displayValue,
          };
        });

      const patientDataResults = await Promise.all(patientDataPromises);

      patientDataResults.forEach(({ dataElementId, displayValue }) => {
        const currentAnswer = answers.find(a => a.dataElementId === dataElementId);
        if (currentAnswer) {
          currentAnswer.body = displayValue;
        }
      });

      return transformedSurveyResponse;
    },
    {
      enabled: !!surveyResponse,
      ...queryResult,
    },
  );
};
