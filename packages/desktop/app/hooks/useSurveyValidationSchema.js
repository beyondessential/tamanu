import { useEffect, useState } from 'react';
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
        const { min, max, mandatory } = parseJSONColumn(validationCriteria) || {};
        const { id, type, defaultText } = dataElement;
        const text = componentText || defaultText;
        switch (type) {
          case 'Number':
            acc[id] = yup
              .number()
              .nullable()
              .min(min, `${text} must be at least ${min}`)
              .max(max, `${text} can not exceed ${max}`)
              [mandatory ? 'required' : 'notRequired']();
            break;
          case 'Select':
            acc[id] = yup.string()[mandatory ? 'required' : 'notRequired']();
            break;
          case 'DateTime':
            acc[id] = yup.date()[mandatory ? 'required' : 'notRequired']();
            break;
          default:
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
