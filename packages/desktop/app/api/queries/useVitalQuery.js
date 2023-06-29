import { useQueries, useQuery } from '@tanstack/react-query';
import { useApi, isErrorUnknownAllow404s } from '../index';

const queryFn = (api, encounterId, vitalDataElementId, startDate, endDate) => {
  return api.get(
    `encounter/${encounterId}/vitals/${vitalDataElementId}`,
    { startDate, endDate },
    { isErrorUnknown: isErrorUnknownAllow404s },
  );
};

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
    () => queryFn(api, encounterId, vitalDataElementId, startDate, endDate),
  );

  const chartData = transformVitalDataToChartData(vitalQuery);

  return {
    ...vitalQuery,
    data: chartData,
  };
};

export const useVitalQueries = (encounterId, vitalDataElementIds, startDate, endDate) => {
  const api = useApi();

  const vitalQueries = useQueries({
    queries: vitalDataElementIds.map(vitalDataElementId => ({
      queryKey: ['encounterVital', encounterId, vitalDataElementId, startDate, endDate],
      queryFn: () => queryFn(api, encounterId, vitalDataElementId, startDate, endDate),
    })),
  });

  const isLoading = vitalQueries.some(query => query.isLoading);
  const chartsData = vitalQueries.map(vitalQuery => {
    const chartData = transformVitalDataToChartData(vitalQuery);
    return chartData;
  });

  return {
    isLoading,
    data: chartsData,
  };
};
