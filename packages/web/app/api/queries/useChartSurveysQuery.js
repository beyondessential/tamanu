import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { SURVEY_TYPES } from '@tamanu/constants';

export const useChartSurveysQuery = () => {
  const api = useApi();

  return useQuery(['chartSurveys'], () => api.get('survey/charts'), {
    select: data => {
      const complexToCoreSurveysMap = {};
      const complexChartSurveys = data.filter(s => s.surveyType === SURVEY_TYPES.COMPLEX_CHART);

      // For a program, there should only be 1 COMPLEX and COMPLEX_CORE survey
      // So we can map the COMPLEX survey to the COMPLEX_CORE survey here
      complexChartSurveys.forEach(survey => {
        const coreSurvey = data.find(
          s => s.programId === survey.programId && s.surveyType === SURVEY_TYPES.COMPLEX_CHART_CORE,
        );
        complexToCoreSurveysMap[survey.id] = coreSurvey?.id;
      });

      return {
        chartSurveys: data,
        complexToCoreSurveysMap,
      };
    },
  });
};
