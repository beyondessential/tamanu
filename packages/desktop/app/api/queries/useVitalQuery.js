import { useQuery } from '@tanstack/react-query';
import { useApi, isErrorUnknownAllow404s } from '../index';

const transformVitalDataToChartData = vitalQuery => {
  const { data: vitalDataAndCount = {} } = vitalQuery;
  const { data: vitalData = [] } = vitalDataAndCount;

  const chartData = vitalData.map(({ recordedDate, body }) => ({
    name: recordedDate,
    value: body,
  }));

  return chartData;
};

export const useVitalQuery = (encounterId, vitalDataElementId, startDate, endDate) => {
  const api = useApi();

  const vitalQuery = useQuery(
    ['encounterVital', encounterId, vitalDataElementId, startDate, endDate],
    () => {
      return api.get(
        `encounter/${encounterId}/vitals/${vitalDataElementId}`,
        { startDate, endDate },
        { isErrorUnknown: isErrorUnknownAllow404s },
      );
    },
  );

  const chartData = transformVitalDataToChartData(vitalQuery);

  return {
    ...vitalQuery,
    data: chartData,
  };
};
