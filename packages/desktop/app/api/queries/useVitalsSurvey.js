import { useQuery } from '@tanstack/react-query';
import * as yup from 'yup';
import { useApi, isErrorUnknownAllow404s } from '../index';
import { getConfigObject } from '../../utils';

export const useVitalsSurvey = () => {
  const api = useApi();
  const vitalsSurvey = useQuery(['survey', { type: 'vitals' }], () =>
    api.get(`survey/vitals`, {}, { isErrorUnknown: isErrorUnknownAllow404s }),
  );

  const { data: surveyData, isLoading } = vitalsSurvey;

  const visualisationConfigSchema = yup.object().shape({
    yAxis: yup.object().shape({
      graphRange: yup.object().shape({
        min: yup.number().required(),
        max: yup.number().required(),
      }),
      normalRange: yup.object().shape({
        min: yup.number().required(),
        max: yup.number().required(),
      }),
      interval: yup.number().required(),
    }),
  });
  let visualisationConfigs = [];
  if (!isLoading && surveyData) {
    visualisationConfigs = surveyData.components.map(({ id, dataElement }) => {
      const visualisationConfigObject = getConfigObject(id, dataElement.visualisationConfig);
      const hasVitalChart = visualisationConfigSchema.isValidSync(visualisationConfigObject);

      return {
        key: dataElement.name,
        hasVitalChart,
        ...getConfigObject(id, dataElement.visualisationConfig),
      };
    });
  }

  return { ...vitalsSurvey, visualisationConfigs };
};
