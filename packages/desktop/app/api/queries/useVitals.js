import { useQuery } from '@tanstack/react-query';
import { VITALS_DATA_ELEMENT_IDS } from 'shared/constants/surveys';
import { useApi, isErrorUnknownAllow404s } from '../index';
import { useVitalsSurvey } from './useVitalsSurvey';
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

  const surveyQuery = useVitalsSurvey();
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
      .map(({ id, config, validationCriteria, dataElement }) => {
        const { records = {} } = elementIdToAnswer[dataElement.id] || {};
        const configs = {
          validationCriteria: getConfigObject(id, validationCriteria),
          config: getConfigObject(id, config),
        };
        return recordedDates.reduce(
          (state, date) => ({
            ...state,
            [date]: {
              value: records[date],
              ...configs,
            },
          }),
          {
            value: dataElement.name,
            ...configs,
          },
        );
      });
  }

  return {
    ...vitalsQuery,
    data: vitalsRecords,
    recordedDates,
    error,
  };
};
