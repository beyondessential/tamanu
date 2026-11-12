import { useQuery } from '@tanstack/react-query';
import { VITALS_DATA_ELEMENT_IDS } from '@tamanu/constants';
import { combineQueries, useApi } from '../index';
import { useVitalsSurveyQuery } from './useVitalsSurveyQuery';
import { getDatesAndRecords } from './useEncounterChartsQuery';
import { route } from '@tamanu/api-client';

export const useVitalsQuery = encounterId => {
  const api = useApi();
  const vitalsQuery = useQuery(['encounterVitals', encounterId], () =>
    api.get(route('encounter/:encounterId/vitals', { encounterId }), { rowsPerPage: 50 }),
  );
  const surveyQuery = useVitalsSurveyQuery();

  const {
    data: [vitalsData, surveyData],
    error,
    isLoading,
  } = combineQueries([vitalsQuery, surveyQuery]);

  const { recordedDates, records } = getDatesAndRecords(
    vitalsData?.data || [],
    surveyData,
    VITALS_DATA_ELEMENT_IDS.dateRecorded,
  );

  return {
    data: records,
    recordedDates,
    error,
    isLoading,
  };
};
