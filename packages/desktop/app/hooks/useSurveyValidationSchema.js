import { useEffect, useState } from 'react';
import { PROGRAM_DATA_ELEMENT_TYPES } from 'shared/constants/surveys';
import * as yup from 'yup';

const parseJSONColumn = field => {
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
        const { min, max, mandatory } =
          parseJSONColumn(validationCriteria) || validationCriteria || {};
        const { id, type, defaultText } = dataElement;
        const text = componentText || defaultText;
        switch (type) {
          case PROGRAM_DATA_ELEMENT_TYPES.NUMBER:
            acc[id] = yup
              .number()
              .nullable()
              .min(min, `${text} must be at least ${min}`)
              .max(max, `${text} can not exceed ${max}`)
              [mandatory ? 'required' : 'notRequired']();
            break;
          case PROGRAM_DATA_ELEMENT_TYPES.AUTOCOMPLETE:
          case PROGRAM_DATA_ELEMENT_TYPES.TEXT:
          case PROGRAM_DATA_ELEMENT_TYPES.SELECT:
            acc[id] = yup.string()[mandatory ? 'required' : 'notRequired']();
            break;
          case PROGRAM_DATA_ELEMENT_TYPES.DATE:
          case PROGRAM_DATA_ELEMENT_TYPES.DATE_TIME:
          case PROGRAM_DATA_ELEMENT_TYPES.SUBMISSION_DATE:
            acc[id] = yup.date()[mandatory ? 'required' : 'notRequired']();
            break;
          default:
            acc[id] = yup.mixed()[mandatory ? 'required' : 'notRequired']();
            break;
        }
        return acc;
      },
      {},
    );

    setValidationSchema(yup.object().shape(schema));
  }, [surveyData]);

  return validationSchema;
};
