import { useQuery } from '@tanstack/react-query';

import { useApi, isErrorUnknownAllow404s } from '../index';
import { getConfigObject } from '../../utils';
import { BLOOD_PRESSURE, LINE, bloodPressureChartKeys } from '../../components/Charts/constants';

export const useVitalsSurveyQuery = () => {
  const api = useApi();
  const vitalsSurvey = useQuery(['survey', { type: 'vitals' }], () =>
    api.get(`survey/vitals`, {}, { isErrorUnknown: isErrorUnknownAllow404s }),
  );

  const { data: surveyData, isLoading } = vitalsSurvey;

  let visualisationConfigs = [];
  if (!isLoading && surveyData) {
    visualisationConfigs = surveyData.components.map(({ id, dataElement, config }) => {
      const hasVitalChart = !!dataElement.visualisationConfig;
      const isBloodPressureChart = bloodPressureChartKeys.includes(dataElement.id);

      return {
        chartType: isBloodPressureChart ? BLOOD_PRESSURE : LINE,
        key: dataElement.id,
        name: bloodPressureChartKeys.includes(dataElement.id)
          ? 'Blood pressure (mm Hg)'
          : dataElement.name,
        hasVitalChart,
        config: getConfigObject(id, config),
        ...getConfigObject(id, dataElement.visualisationConfig),
      };
    });
  }

  return { ...vitalsSurvey, visualisationConfigs };
};
