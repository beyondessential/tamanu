import { useQuery } from '@tanstack/react-query';
import { VITALS_DATA_ELEMENT_IDS } from 'shared/constants/surveys';
import { useApi } from '../api';
import { useVitalsSurvey } from '../api/queries';
import { getConfigObject, getValidationCriteriaObject } from '../utils';
import { getMeasureCellConfig, getVitalsCellConfig } from '../utils/vitalsTableUtils';

export const useVitals = encounterId => {
  const api = useApi();
  const query = useQuery(['encounterVitals', encounterId], () =>
    api.get(`encounter/${encounterId}/vitals`, { rowsPerPage: 50 }),
  );

  const { data: vitalsSurvey, error: vitalsError } = useVitalsSurvey();
  const error = query.error || vitalsError;

  let vitalsRecords = [];
  let recordedDates = [];
  const data = query?.data?.data || [];

  if (data.length > 0 && vitalsSurvey) {
    recordedDates = Object.keys(
      data.find(vital => vital.dataElementId === VITALS_DATA_ELEMENT_IDS.dateRecorded).records,
    );

    const elementIdToAnswer = data.reduce((dict, a) => ({ ...dict, [a.dataElementId]: a }), {});

    vitalsRecords = vitalsSurvey.components
      .filter(component => component.dataElementId !== VITALS_DATA_ELEMENT_IDS.dateRecorded)
      .map(({ id, config, validationCriteria, dataElement }) => {
        const { records = {} } = elementIdToAnswer[dataElement.id] || {};
        const validationCriteriaObj = getValidationCriteriaObject(id, validationCriteria);
        const configObj = getConfigObject(id, config);
        return recordedDates.reduce(
          (state, date) => ({
            ...state,
            [date]: getVitalsCellConfig(records[date], validationCriteriaObj, configObj),
          }),
          { title: getMeasureCellConfig(dataElement.name, validationCriteriaObj, configObj) },
        );
      });
  }

  return {
    ...query,
    data: vitalsRecords,
    recordedDates,
    error,
  };
};
