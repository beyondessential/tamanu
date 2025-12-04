import { useQuery } from '@tanstack/react-query';
import { isErrorUnknownAllow404s, useApi } from '../index';
import { transformVitalDataToChartData } from './useGraphDataQuery';

export const useProgramRegistryGraphDataQuery = (patientId, dataElementId, dateRange) => {
  const api = useApi();
  const [startDate, endDate] = dateRange;
  const directory = 'charts';

  const query = useQuery(
    [
      'programRegistry',
      'patient',
      patientId,
      'graphData',
      directory,
      dataElementId,
      startDate,
      endDate,
    ],
    () =>
      api.get(
        `programRegistry/patient/${patientId}/graphData/${directory}/${dataElementId}`,
        { startDate, endDate },
        { isErrorUnknown: isErrorUnknownAllow404s },
      ),
    {
      enabled: Boolean(patientId),
    },
  );

  const graphData = transformVitalDataToChartData(query);

  return {
    ...query,
    data: graphData,
  };
};
