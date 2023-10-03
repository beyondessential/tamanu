import * as yup from 'yup';
import {
  PROGRAM_DATA_ELEMENT_TYPE_VALUES,
  PATIENT_DATA_FIELD_LOCATIONS,
  VISIBILITY_STATUSES,
  CURRENTLY_AT_TYPES,
} from '@tamanu/constants';
import { SurveyScreenComponent, baseValidationShape, baseConfigShape } from './baseSchemas';
import { configString, validationString, visualisationConfigString } from './jsonString';
import { isNumberOrFloat } from '../../utils/numbers';
import { mathjsString } from './mathjsString';

const testIncompatibleCurrentlyAtType = async (fieldName, ctx) => {
  const { models, programId } = ctx.options.context;
  const programRegistry = await models.ProgramRegistry.findOne({
    where: {
      programId,
      visibilityStatus: VISIBILITY_STATUSES.CURRENT,
    },
  });
  if (!programRegistry) return true;

  if (programRegistry?.currentlyAtType === CURRENTLY_AT_TYPES.VILLAGE)
    return fieldName !== 'registrationCurrentlyAtFacility';
  if (programRegistry?.currentlyAtType === CURRENTLY_AT_TYPES.FACILITY)
    return fieldName !== 'registrationCurrentlyAtVillage';
  return true;
};

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
          fieldName: yup
            .string()
            .oneOf(Object.keys(PATIENT_DATA_FIELD_LOCATIONS))
            .required()
            .test(
              'incompatible-currently-at-type',
              ({ value }) => {
                const inferredCurrentlyAtType =
                  value === 'registrationCurrentlyAtFacility' ? 'village' : 'facility';
                return `fieldName=${value} but program registry configured for ${inferredCurrentlyAtType}`;
              },
              testIncompatibleCurrentlyAtType,
            ),
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

const normalRangeObjectSchema = yup
  .object()
  .shape({
    min: yup.number(),
    max: yup.number(),
    ageUnit: yup.string().oneOf(['years', 'months', 'weeks']),
    ageMin: yup.number(),
    ageMax: yup.number(),
  })
  .noUnknown()
  .test({
    name: 'normalRange',
    message: ctx => `normalRange should have either min or max, got ${JSON.stringify(ctx.value)}`,
    test: value => {
      if (!value) {
        return true;
      }
      return isNumberOrFloat(value.min) || isNumberOrFloat(value.max);
    },
  });

const visualisationConfigSchema = yup.object().shape({
  yAxis: yup.object().shape({
    graphRange: yup
      .object()
      .shape({
        min: yup.number().required(),
        max: yup.number().required(),
      })
      .required(),
    interval: yup.number().required(),
  }),
});

const numberValidationCriteria = baseValidationShape.shape({
  min: yup.number(),
  max: yup.number(),
  normalRange: yup.lazy(value =>
    Array.isArray(value) ? yup.array().of(normalRangeObjectSchema) : normalRangeObjectSchema,
  ),
});

export const SSCNumber = SurveyScreenComponent.shape({
  config: configString(numberConfig),
  validationCriteria: validationString(numberValidationCriteria),
  visualisationConfig: visualisationConfigString(visualisationConfigSchema),
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
