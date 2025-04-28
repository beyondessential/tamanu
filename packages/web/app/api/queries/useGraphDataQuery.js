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
  const query = useQuery(
    ['encounterGraphData', encounterId, vitalDataElementId, startDate, endDate, isVital],
    () => {
      return api.get(
        `encounter/${encounterId}/graphData/${vitalDataElementId}`,
        { startDate, endDate, isVital },
        { isErrorUnknown: isErrorUnknownAllow404s },
      );
    },
  );

  const graphData = transformVitalDataToChartData(query);

  return {
    ...query,
    data: graphData,
  };
};
