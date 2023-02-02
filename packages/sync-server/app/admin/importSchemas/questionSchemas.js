import * as yup from 'yup';
import { SurveyScreenComponent, baseValidationShape } from './baseSchemas';
import { configString, validationString } from './jsonString';

const config = yup.object().noUnknown();

const columnReferenceConfig = config.shape({
  column: yup.string().required(),
});

export const SSCUserData = SurveyScreenComponent.shape({
  config: configString(columnReferenceConfig),
});
export const SSCPatientData = SurveyScreenComponent.shape({
  config: configString(
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
  config: configString(sourceReferenceConfig),
});
export const SSCSurveyResult = SurveyScreenComponent.shape({
  config: configString(sourceReferenceConfig),
});
export const SSCSurveyAnswer = SurveyScreenComponent.shape({
  config: configString(sourceReferenceConfig),
});
export const SSCAutocomplete = SurveyScreenComponent.shape({
  config: configString(
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
  rounding: yup.number(),
});
const numberValidationCriteria = baseValidationShape.shape({
  min: yup.number(),
  max: yup.number(),
  normalRange: yup.object().shape({
    min: yup.number(),
    max: yup.number(),
  }),
});

export const SSCNumber = SurveyScreenComponent.shape({
  config: configString(numberConfig),
  validationCriteria: validationString(numberValidationCriteria),
});
export const SSCCalculatedQuestion = SurveyScreenComponent.shape({
  config: configString(numberConfig),
  validationCriteria: validationString(numberValidationCriteria),
});
export const SSCResult = SurveyScreenComponent.shape({
  config: configString(numberConfig),
  validationCriteria: validationString(numberValidationCriteria),
});
