import * as yup from 'yup';
import {
  PROGRAM_DATA_ELEMENT_TYPE_VALUES,
  REFERENCE_TYPE_VALUES,
} from 'shared/constants';
import { Base } from './importSchemas';

function isValidJson(value) {
  if (!value) return true;
  try {
    JSON.parse(value);
    return true;
  } catch (e) {
    return false;
  }
};

yup.addMethod(yup.string, "validJson", function(errorMessage) {
  return this.test('test-json', errorMessage, function (value) {
    const { path, createError } = this;

    return (
      isValidJson(value) || createError({ path, message: errorMessage })
    )
  });
});

yup.addMethod(yup.string, "validJsonWithSchema", function(schema, errorMessage) {
  return this.validJson().test('test-json-schema', errorMessage, function(value) {
    if (!value) return true;

    const json = JSON.parse(value);

    try {
      schema.validate(json);
    } catch(e) {
      console.log("ERRORED JSON", json, e);
      return e;
    }

    console.log("matches schema:", json)
    return true;
  });
});

export const ProgramDataElement = Base.shape({
  indicator: yup.string(),
  type: yup
    .string()
    .required()
    .oneOf(PROGRAM_DATA_ELEMENT_TYPE_VALUES),
  defaultOptions: yup.string().validJson(),
});

const visibilityCriteriaSchema = yup.object().shape({
  optional: yup.number(),
});

const validationCriteriaSchema = yup.object().shape({

});

const SUGGESTER_SOURCES = [
  'ABC'
];

const configSchema = yup.object().shape({
  source: yup.string().oneOf(SUGGESTER_SOURCES),
  where: yup.object().shape({
    type: yup.string().oneOf(REFERENCE_TYPE_VALUES)
  })
}).test('check-config', 'invalid config', (value) => {
  return false;
});

export const SurveyScreenComponent = Base.shape({
  visibilityCriteria: yup.string().validJsonWithSchema(visibilityCriteriaSchema),
  validationCriteria: yup.string().validJsonWithSchema(validationCriteriaSchema),
  config: yup.string().validJsonWithSchema(configSchema),
  screenIndex: yup.number().required(),
  componentIndex: yup.number().required(),
  options: yup.string().validJson(),
  calculation: yup.string(),
  surveyId: yup.string().required(),
  detail: yup.string().max(255),
  dataElementId: yup.string().required(),
});

export const Survey = Base.shape({
  surveyType: yup
    .string()
    .required()
    .oneOf(['programs', 'referral', 'obsolete']),
  isSensitive: yup.boolean().required(),
});
