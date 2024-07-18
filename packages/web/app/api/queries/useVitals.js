import { useQuery } from '@tanstack/react-query';
import { VISIBILITY_STATUSES, VITALS_DATA_ELEMENT_IDS } from '@tamanu/constants';
import { isErrorUnknownAllow404s, useApi } from '../index';
import { useVitalsSurveyQuery } from './useVitalsSurveyQuery';
import { getConfigObject } from '../../utils';

function hasHistoricalData(answer) {
  if (!answer) return false;
  const { records } = answer;
  return Object.values(records).some(record => record.body);
}

function getSortedLogsByDate(logs) {
  if (!logs) return [];
  return logs.slice().sort((a, b) => b.date.localeCompare(a.date));
}

function getDatesAndRecords(data, surveyData) {
  if (data.length > 0 === false || Boolean(surveyData) === false) {
    return { recordedDates: [], records: [] };
  }

  const recordedDates = Object.keys(
    data.find(vital => vital.dataElementId === VITALS_DATA_ELEMENT_IDS.dateRecorded)
      .records,
  );

  const elementIdToAnswer = data.reduce(
    (dict, a) => ({ ...dict, [a.dataElementId]: a }),
    {},
  );

  const records = surveyData.components
    .filter(component => component.dataElementId !== VITALS_DATA_ELEMENT_IDS.dateRecorded)
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

  const { recordedDates, records } = getDatesAndRecords(vitalsData, surveyData);

  return {
    ...vitalsQuery,
    data: records,
    recordedDates,
    error,
  };
};
