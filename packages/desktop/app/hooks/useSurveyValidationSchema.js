import { useEffect, useState } from 'react';
import { PROGRAM_DATA_ELEMENT_TYPES } from 'shared/constants/surveys';
import * as yup from 'yup';

export const parseJSONColumn = field => {
  if (!field) return null;
  try {
    return JSON.parse(field);
  } catch {
    return null;
  }
};

export const useSurveyValidationSchema = surveyData => {
  const [validationSchema, setValidationSchema] = useState({});

  useEffect(() => {
    if (!surveyData) return;
    const { components } = surveyData;
    const schema = components.reduce(
      (acc, { dataElement, validationCriteria, text: componentText }) => {
        const { min, max, mandatory } = parseJSONColumn(validationCriteria) || {};
        const { id, type, defaultText } = dataElement;
        const text = componentText || defaultText;
        let valueSchema;
        switch (type) {
          case PROGRAM_DATA_ELEMENT_TYPES.NUMBER: {
            valueSchema = yup.number().nullable();
            if (min) {
              valueSchema = valueSchema.min(min, `${text} must be at least ${min}`);
            }
            if (max) {
              valueSchema = valueSchema.max(max, `${text} can not exceed ${max}`);
            }
            break;
          }
          case PROGRAM_DATA_ELEMENT_TYPES.AUTOCOMPLETE:
          case PROGRAM_DATA_ELEMENT_TYPES.TEXT:
          case PROGRAM_DATA_ELEMENT_TYPES.SELECT:
            valueSchema = yup.string();
            break;
          case PROGRAM_DATA_ELEMENT_TYPES.DATE:
          case PROGRAM_DATA_ELEMENT_TYPES.DATE_TIME:
          case PROGRAM_DATA_ELEMENT_TYPES.SUBMISSION_DATE:
            valueSchema = yup.date();
            break;
          default:
            valueSchema = yup.mixed();
            break;
        }
        return { ...acc, [id]: valueSchema[mandatory ? 'required' : 'notRequired']() };
      },
      {},
    );

    setValidationSchema(yup.object().shape(schema));
  }, [surveyData]);

  return validationSchema;
};
