import { useQuery } from '@tanstack/react-query';
import { CHARTING_DATA_ELEMENT_IDS, VISIBILITY_STATUSES } from '@tamanu/constants';
import { combineQueries, isErrorUnknownAllow404s, useApi } from '../index';
import { getConfigObject } from '../../utils';
import { useSurveyQuery } from './useSurveyQuery';

function hasHistoricalData(answer) {
  if (!answer) return false;
  const { records } = answer;
  return Object.values(records).some(record => record.body);
}

function getSortedLogsByDate(logs) {
  if (!logs) return [];
  return logs.slice().sort((a, b) => b.date.localeCompare(a.date));
}

export function getDatesAndRecords(data, surveyData, dateElementId) {
  if (data.length > 0 === false || Boolean(surveyData) === false) {
    return { recordedDates: [], records: [] };
  }

  const recordedDates = Object.keys(
    data.find(record => record.dataElementId === dateElementId).records,
  );

  const elementIdToAnswer = {};
  data.forEach(answer => {
    elementIdToAnswer[answer.dataElementId] = answer;
  });

  const records = surveyData.components
    .filter(component => component.dataElementId !== dateElementId)
    // Show current components or ones that have historical data in them
    .filter(
      component =>
        component.visibilityStatus === VISIBILITY_STATUSES.CURRENT ||
        hasHistoricalData(elementIdToAnswer[component.dataElementId]),
    )
    .map(component => {
      const { id, config, validationCriteria, dataElement } = component;
      const { records = {} } = elementIdToAnswer[dataElement.id] || {};
      const configs = {
        validationCriteria: getConfigObject(id, validationCriteria),
        config: getConfigObject(id, config),
      };
      return recordedDates.reduce(
        (state, date) => ({
          ...state,
          [date]: {
            component,
            recordedDate: date,
            answerId: records[date]?.id,
            value: records[date]?.body,
            historyLogs: getSortedLogsByDate(records[date]?.logs),
            ...configs,
          },
        }),
        {
          dataElementId: dataElement.id,
          value: dataElement.name,
          ...configs,
        },
      );
    });

  return { recordedDates, records };
}

export const useEncounterChartsQuery = (encounterId, surveyId, instanceId) => {
  const api = useApi();
  const chartQuery = useQuery(
    ['encounterCharts', encounterId, surveyId, instanceId],
    () =>
      api.get(
        `encounter/${encounterId}/charts/${surveyId}`,
        { rowsPerPage: 50, instanceId },
        { isErrorUnknown: isErrorUnknownAllow404s },
      ),
    { enabled: Boolean(surveyId) },
  );
  const surveyQuery = useSurveyQuery(surveyId);

  const {
    data: [chartData, surveyData],
    error,
    isLoading,
  } = combineQueries([chartQuery, surveyQuery]);

  const { recordedDates, records } = getDatesAndRecords(
    chartData?.data || [],
    surveyData,
    CHARTING_DATA_ELEMENT_IDS.dateRecorded,
  );

  return {
    data: records,
    recordedDates,
    error,
    isLoading,
  };
};
