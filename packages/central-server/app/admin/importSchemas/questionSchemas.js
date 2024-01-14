import * as yup from 'yup';
import {
  CURRENTLY_AT_TYPES,
  PATIENT_DATA_FIELD_LOCATIONS,
  PROGRAM_DATA_ELEMENT_TYPE_VALUES,
  PROGRAM_REGISTRY_FIELD_LOCATIONS,
  VISIBILITY_STATUSES,
} from '@tamanu/constants';
import { baseConfigShape, baseValidationShape, SurveyScreenComponent } from './baseSchemas';
import { configString, validationString } from './jsonString';
import { mathjsString } from './mathjsString';
import { rangeArraySchema, rangeObjectSchema } from './rangeObject';

const isIncompatibleCurrentlyAtType = (currentlyAtType, value) =>
  (currentlyAtType === CURRENTLY_AT_TYPES.VILLAGE && value === 'registrationCurrentlyAtFacility') ||
  (currentlyAtType === CURRENTLY_AT_TYPES.FACILITY && value === 'registrationCurrentlyAtVillage');

const columnReferenceConfig = baseConfigShape.shape({
  column: yup.string().required(),
});

export const SSCUserData = SurveyScreenComponent.shape({
  config: configString(columnReferenceConfig),
});

const patientDataColumnString = () =>
  yup
    .string()
    .oneOf(Object.keys(PATIENT_DATA_FIELD_LOCATIONS))
    .test('test-program-registry-conditions', async (value, { options, createError, path }) => {
      // No need to validate non-program registry fields
      if (!PROGRAM_REGISTRY_FIELD_LOCATIONS.includes(value)) return true;

      const { models, programId } = options.context;
      const programRegistry = await models.ProgramRegistry.findOne({
        where: {
          programId,
          visibilityStatus: VISIBILITY_STATUSES.CURRENT,
        },
      });
      if (!programRegistry)
        return createError({
          path,
          message: `${path}=${value} but no program registry configured`,
        });

      // Test for incompatible currentlyAtType
      if (isIncompatibleCurrentlyAtType(programRegistry.currentlyAtType, value)) {
        return createError({
          path,
          message: `${path}=${value} but program registry configured for ${programRegistry.currentlyAtType}`,
        });
      }

      return true;
    });

export const SSCPatientData = SurveyScreenComponent.shape({
  config: configString(
    columnReferenceConfig.shape({
      column: patientDataColumnString(),
      writeToPatient: yup
        .object()
        .shape({
          fieldName: patientDataColumnString().required(),
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
