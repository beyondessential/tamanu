import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { SURVEY_TYPES } from '@tamanu/constants';

export const useChartSurveysQuery = () => {
  const api = useApi();

  return useQuery(['chartSurveys'], () => api.get('survey/charts'), {
    select: data => {
      // Assuming `data` is an array of surveys
      const complexToCoreSurveysMap = {};
      const complexChartSurveys = data.filter(
        s => s.surveyType === SURVEY_TYPES.COMPLEX_CHART,
      );
      complexChartSurveys.forEach(survey => {
        const coreSurvey = data.find(
          s => s.programId === survey.programId && s.surveyType === SURVEY_TYPES.COMPLEX_CHART_CORE,
        );
        complexToCoreSurveysMap[survey.id] = coreSurvey.id;
      });

      return {
        chartSurveys: data,
        complexToCoreSurveysMap,
      };
    },
  });
};
