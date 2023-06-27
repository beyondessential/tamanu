import { useQuery } from '@tanstack/react-query';
import { useApi, isErrorUnknownAllow404s } from '../index';
import { getConfigObject } from '../../utils';

export const useVitalsSurvey = () => {
  const api = useApi();
  const vitalsSurvey = useQuery(['survey', { type: 'vitals' }], () =>
    api.get(`survey/vitals`, {}, { isErrorUnknown: isErrorUnknownAllow404s }),
  );

  const { data: surveyData, isLoading } = vitalsSurvey;

  let visualisationConfigs = [];
  if (!isLoading && surveyData) {
    visualisationConfigs = surveyData.components.map(({ id, dataElement }) => {
      const hasVitalChart = !!dataElement.visualisationConfig;

      return {
        key: dataElement.id,
        name: dataElement.name,
        hasVitalChart,
        ...getConfigObject(id, dataElement.visualisationConfig),
      };
    });
  }

  return { ...vitalsSurvey, visualisationConfigs };
};
