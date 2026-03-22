import { useQuery } from '@tanstack/react-query';
import { SURVEY_TYPES } from '@tamanu/constants';
import { useApi } from '../index';

export const useProgramRegistryLinkedChartsQuery = (programRegistryId, patientId) => {
  const api = useApi();

  return useQuery(
    ['programRegistryLinkedCharts', programRegistryId, patientId],
    () => api.get(`programRegistry/${programRegistryId}/linkedCharts?patientId=${patientId}`),
    {
      enabled: Boolean(programRegistryId),
      select: (data) => {
        const complexToCoreSurveysMap = {};
        const complexChartSurveys = data.data.filter((s) => s.surveyType === SURVEY_TYPES.COMPLEX_CHART);

        // For a program, there should only be 1 COMPLEX and COMPLEX_CORE survey
        // So we can map the COMPLEX survey to the COMPLEX_CORE survey here
        complexChartSurveys.forEach((survey) => {
          const coreSurvey = data.data.find(
            (s) =>
              s.programId === survey.programId && s.surveyType === SURVEY_TYPES.COMPLEX_CHART_CORE,
          );
          complexToCoreSurveysMap[survey.id] = coreSurvey?.id;
        });

        return {
          chartSurveys: data.data,
          complexToCoreSurveysMap,
        };
      },
    }
  );
};