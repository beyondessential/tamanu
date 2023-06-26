import { useQuery } from '@tanstack/react-query';
import * as yup from 'yup';
import { useApi, isErrorUnknownAllow404s } from '../index';
import { getConfigObject } from '../../utils';

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

export const useVitalsSurvey = () => {
  const api = useApi();
  const vitalsSurvey = useQuery(['survey', { type: 'vitals' }], () =>
    api.get(`survey/vitals`, {}, { isErrorUnknown: isErrorUnknownAllow404s }),
  );

  const { data: surveyData, isLoading } = vitalsSurvey;

  let visualisationConfigs = [];
  if (!isLoading && surveyData) {
    visualisationConfigs = surveyData.components.map(({ id, dataElement }) => {
      const visualisationConfigObject = getConfigObject(id, dataElement.visualisationConfig);
      const hasVitalChart = visualisationConfigSchema.isValidSync(visualisationConfigObject);

      return {
        key: dataElement.id,
        hasVitalChart,
        ...getConfigObject(id, dataElement.visualisationConfig),
      };
    });
  }

  return { ...vitalsSurvey, visualisationConfigs };
};
