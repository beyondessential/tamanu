import { useQuery } from '@tanstack/react-query';
import { isErrorUnknownAllow404s, useApi } from '../index';

const transformVitalDataToChartData = vitalQuery => {
  const { data: vitalDataAndCount = {} } = vitalQuery;
  const { data: vitalData = [] } = vitalDataAndCount;

  const chartData = vitalData.map(({ recordedDate, body }) => ({
    name: recordedDate,
    value: body,
  }));

  return chartData;
};

export const useGraphDataQuery = (encounterId, vitalDataElementId, dateRange, isVital = false) => {
  const api = useApi();
  const [startDate, endDate] = dateRange;
  const directory = isVital ? 'vitals' : 'charts';
  const query = useQuery(
    ['encounter', encounterId, 'graphData', directory, vitalDataElementId, startDate, endDate, isVital],
    () =>
      api.get(
        `encounter/${encounterId}/graphData/${directory}/${vitalDataElementId}`,
        { startDate, endDate },
        { isErrorUnknown: isErrorUnknownAllow404s },
      ),
    {
      enabled: Boolean(encounterId),
    },
  );

  const graphData = transformVitalDataToChartData(query);

  return {
    ...query,
    data: graphData,
  };
};

export { transformVitalDataToChartData };
