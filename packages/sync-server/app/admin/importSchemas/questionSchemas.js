import * as yup from 'yup';
import { PROGRAM_DATA_ELEMENT_TYPE_VALUES } from '@tamanu/constants';
import { SurveyScreenComponent, baseValidationShape, baseConfigShape } from './baseSchemas';
import { configString, validationString } from './jsonString';
import { mathjsString } from './mathjsString';
import { rangeObjectSchema, rangeArraySchema } from './rangeObject';

const columnReferenceConfig = baseConfigShape.shape({
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
          fieldName: yup.string().required(),
          isAdditionalData: yup.boolean(),
          fieldType: yup
            .string()
            .oneOf(PROGRAM_DATA_ELEMENT_TYPE_VALUES)
            .required(),
        })
        .noUnknown()
        .default(null),
    }),
  ),
});

const sourceReferenceConfig = baseConfigShape.shape({
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
    sourceReferenceConfig
      .shape({
        scope: yup.string(),
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
      })
      .test(
        'only-where-on-referenceData',
        "where field only used for when source='ReferenceData'",
        ({ source, where }) => {
          if (where) {
            return source === 'ReferenceData';
          }
          return true;
        },
      ),
  ),
});

const numberConfig = baseConfigShape.shape({
  unit: yup.string(),
  rounding: yup.number(),
});

const numberValidationCriteria = baseValidationShape.shape({
  min: yup.number(),
  max: yup.number(),
  normalRange: yup.lazy(value => (Array.isArray(value) ? rangeArraySchema : rangeObjectSchema)),
});

export const SSCNumber = SurveyScreenComponent.shape({
  config: configString(numberConfig),
  validationCriteria: validationString(numberValidationCriteria),
});
export const SSCCalculatedQuestion = SurveyScreenComponent.shape({
  config: configString(numberConfig),
  validationCriteria: validationString(numberValidationCriteria),
  calculation: mathjsString().required(),
});
export const SSCResult = SurveyScreenComponent.shape({
  config: configString(numberConfig),
  validationCriteria: validationString(numberValidationCriteria),
  calculation: mathjsString(),
});
