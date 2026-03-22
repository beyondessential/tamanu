import { useCallback } from 'react';
import { camelCase } from 'lodash';
import { PATIENT_DATA_FIELD_LOCATIONS, SEX_LABELS } from '@tamanu/constants';
import { getPatientNameAsString } from '../components';
import { useApi, useTranslation, useDateTime } from '../contexts';

export const usePatientDataDisplayValue = () => {
  const api = useApi();
  const { formatShort } = useDateTime();
  const { getEnumTranslation, getReferenceDataTranslation } = useTranslation();

  const getDisplayValue = useCallback(
    async (value, config = {}) => {
      const [modelName, , options] = PATIENT_DATA_FIELD_LOCATIONS[config.column] || [];
      if (!modelName) {
        return value;
      } else if (options) {
        const translation = getEnumTranslation(options, value);
        return translation || value;
      } else {
        try {
          const { data, model } = await api.get(
            `surveyResponse/patient-data-field-association-data/${config.column}`,
            {
              value,
            },
          );
          if (!model) return value;

          switch (model) {
            case 'ReferenceData':
              return getReferenceDataTranslation({
                value: data.id,
                category: data.type,
                fallback: data.name,
              });
            case 'User':
              return data?.displayName;
            case 'Patient':
              return `${getPatientNameAsString(data)} (${data.displayId}) - ${getEnumTranslation(
                SEX_LABELS,
                data.sex,
              )} - ${formatShort(data.dateOfBirth)}`;
            default: {
              const category = camelCase(model);
              return getReferenceDataTranslation({
                value: data.id,
                category,
                fallback: data.name || value,
              });
            }
          }
        } catch (error) {
          return value;
        }
      }
    },
    [api, getEnumTranslation, getReferenceDataTranslation, formatShort],
  );

  return { getDisplayValue };
};
