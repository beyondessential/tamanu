import { useQuery } from '@tanstack/react-query';
import { useApi } from '../index';
import { transformVitalDataToChartData } from './useGraphDataQuery';
import { route } from '@tamanu/api-client';

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
        route('programRegistry/patient/:patientId/graphData/:directory/:dataElementId', {
          patientId,
          directory,
          dataElementId,
        }),
        { startDate, endDate },
      ),
    {
      enabled: Boolean(patientId) && Boolean(startDate) && Boolean(endDate),
    },
  );

  const graphData = transformVitalDataToChartData(query);

  return {
    ...query,
    data: graphData,
  };
};
