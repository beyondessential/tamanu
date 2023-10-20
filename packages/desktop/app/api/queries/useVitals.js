import { useQuery } from '@tanstack/react-query';
import { VITALS_DATA_ELEMENT_IDS } from '@tamanu/constants/surveys';
import { useApi, isErrorUnknownAllow404s } from '../index';
import { useVitalsSurveyQuery } from './useVitalsSurveyQuery';
import { getConfigObject } from '../../utils';

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

  let vitalsRecords = [];
  let recordedDates = [];
  const vitalsData = vitalsQuery?.data?.data || [];
  const surveyData = surveyQuery?.data;

  if (vitalsData.length > 0 && surveyData) {
    recordedDates = Object.keys(
      vitalsData.find(vital => vital.dataElementId === VITALS_DATA_ELEMENT_IDS.dateRecorded)
        .records,
    );

    const elementIdToAnswer = vitalsData.reduce(
      (dict, a) => ({ ...dict, [a.dataElementId]: a }),
      {},
    );

    vitalsRecords = surveyData.components
      .filter(component => component.dataElementId !== VITALS_DATA_ELEMENT_IDS.dateRecorded)
      .filter(
        component =>
          component.visibilityStatus === 'current' || elementIdToAnswer[component.dataElement.id],
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
  }

  console.log(vitalsRecords);

  return {
    ...vitalsQuery,
    data: vitalsRecords,
    recordedDates,
    error,
  };
};

function getSortedLogsByDate(logs) {
  if (!logs) return [];
  return logs.slice().sort((a, b) => b.date.localeCompare(a.date));
}
