import { useQuery } from '@tanstack/react-query';
import { VITALS_DATA_ELEMENT_IDS } from '@tamanu/constants';
import { isErrorUnknownAllow404s, useApi } from '../index';
import { useVitalsSurveyQuery } from './useVitalsSurveyQuery';
import { getDatesAndRecords } from './useChartQuery';

export const useVitals = encounterId => {
  const api = useApi();
  const vitalsQuery = useQuery(['encounterVitals', encounterId], () =>
    api.get(
      `encounter/${encounterId}/vitals`,
      { rowsPerPage: 50 },
      { isErrorUnknown: isErrorUnknownAllow404s },
    ),
  );

  const surveyQuery = useVitalsSurveyQuery();
  const error = vitalsQuery.error || surveyQuery.error;

  const vitalsData = vitalsQuery?.data?.data || [];
  const surveyData = surveyQuery?.data;

  const { recordedDates, records } = getDatesAndRecords(
    vitalsData,
    surveyData,
    VITALS_DATA_ELEMENT_IDS.dateRecorded,
  );

  return {
    ...vitalsQuery,
    data: records,
    recordedDates,
    error,
  };
};
