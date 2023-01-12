import * as yup from 'yup';
import { SurveyScreenComponent /* , SSCValidationCriteria */ } from './baseSchemas';

const jsonStringShape = (name, objectShape) =>
  yup.string().test('json-shape', value => {
    let parseValue = value;
    // We usually accept empty strings for configs, but there might be required fields
    // So attempt the validation with an empty object just in case
    if (!value) parseValue = '{}';
    let parsedObject = null;
    try {
      parsedObject = JSON.parse(parseValue);
      // Will throw a validation error if shape doesn't match
      return objectShape.validateSync(parsedObject, { strict: true });
    } catch (e) {
      let errors = [];
      // ValidationError has multiple errors within
      if (e.errors) {
        errors = e.errors.map(err => `${name}: ${err}`);
      } else {
        // We land here if JSON.parse fails
        errors = [`${name}: ${e.message}`];
      }
      return new yup.ValidationError(errors);
    }
  });

const SSCValidationCriteria = yup
  .object()
  .shape({
    mandatory: yup.boolean(),
  })
  .noUnknown();

const config = yup.object().noUnknown();

const columnReferenceConfig = config.shape({
  column: yup.string().required(),
});

export const SSCUserData = SurveyScreenComponent.shape({
  config: jsonStringShape('config', columnReferenceConfig),
});
export const SSCPatientData = SurveyScreenComponent.shape({
  config: jsonStringShape(
    'config',
    columnReferenceConfig.shape({
      writeToPatient: yup
        .object()
        .shape({
          field: yup.string().required(),
          isAdditionalData: yup.boolean(),
          fieldType: yup.string(),
        })
        .default(null),
    }),
  ),
});

const sourceReferenceConfig = config.shape({
  source: yup.string().required(),
});

export const SSCSurveyLink = SurveyScreenComponent.shape({
  config: jsonStringShape('config', sourceReferenceConfig),
});
export const SSCSurveyResult = SurveyScreenComponent.shape({
  config: jsonStringShape('config', sourceReferenceConfig),
});
export const SSCSurveyAnswer = SurveyScreenComponent.shape({
  config: jsonStringShape('config', sourceReferenceConfig),
});
export const SSCAutocomplete = SurveyScreenComponent.shape({
  config: jsonStringShape(
    'config',
    sourceReferenceConfig.shape({
      where: yup
        .object()
        .when('source', {
          is: 'ReferenceData',
          then: yup
            .object()
            .shape({
              type: yup.string().required(),
            })
            .required(),
        })
        .default(null),
    }),
  ),
});

const numberConfig = config.shape({
  unit: yup.string(),
});
const numberValidationCriteria = SSCValidationCriteria.shape({
  min: yup.number(),
  max: yup.number(),
  normalRange: yup.object().shape({
    min: yup.number(),
    max: yup.number(),
  }),
});
const numberConfigString = jsonStringShape('config', numberConfig);
const numberValidationString = jsonStringShape('validationCriteria', numberValidationCriteria);

export const SSCNumber = SurveyScreenComponent.shape({
  config: numberConfigString,
  validationCriteria: numberValidationString,
});
export const SSCCalculatedQuestion = SurveyScreenComponent.shape({
  config: numberConfigString,
  validationCriteria: numberValidationString,
});
export const SSCResult = SurveyScreenComponent.shape({
  config: numberConfigString,
  validationCriteria: numberValidationString,
});
