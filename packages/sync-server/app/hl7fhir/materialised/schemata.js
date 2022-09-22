import * as yup from 'yup';

import { FHIR_SEARCH_PARAMETERS, FHIR_SEARCH_PREFIXES } from 'shared/constants';

const SEARCH_PREFIXES_ENUM = Object.values(FHIR_SEARCH_PREFIXES);

export const DEFAULT_SCHEMA_FOR_TYPE = {
  [FHIR_SEARCH_PARAMETERS.NUMBER]: yup
    .object()
    .transform(function(value, originalValue) {
      if (this.isType(value)) return value;

      const prefix = SEARCH_PREFIXES_ENUM.find(pref => originalValue.startsWith(pref));
      const number = originalValue.replace(new RegExp(`^${prefix}`), '');

      return { prefix, number };
    })
    .shape({
      prefix: yup
        .string()
        .oneOf(SEARCH_PREFIXES_ENUM)
        .nullable(),
      number: yup.number().required(),
    })
    .noUnknown(),
  [FHIR_SEARCH_PARAMETERS.DATE]: yup
    .object()
    .transform(function(value, originalValue) {
      if (this.isType(value)) return value;

      const prefix = SEARCH_PREFIXES_ENUM.find(pref => originalValue.startsWith(pref));
      const date = originalValue.replace(new RegExp(`^${prefix}`), '');

      return { prefix, date };
    })
    .shape({
      prefix: yup
        .string()
        .oneOf(SEARCH_PREFIXES_ENUM)
        .nullable(),
      date: yup
        .string()
        .matches(/^\d{4}(-\d{2}(-\d{2})?)?$/, 'Dates must be either YYYY or YYYY-MM or YYYY-MM-DD'),
    })
    .noUnknown(),
  [FHIR_SEARCH_PARAMETERS.STRING]: yup.string(),
  [FHIR_SEARCH_PARAMETERS.TOKEN]: yup
    .object()
    .transform(function(value, originalValue) {
      if (this.isType(value)) return value;

      const [system, code] = originalValue.includes('|')
        ? originalValue.split('|', 2)
        : [null, originalValue];
      return { system, code };
    })
    .shape({
      system: yup
        .string()
        .url()
        .nullable(),
      code: yup.string().nullable(),
    })
    .noUnknown(),
  [FHIR_SEARCH_PARAMETERS.REFERENCE]: yup
    .object()
    .transform(function(value, originalValue) {
      if (this.isType(value)) return value;

      try {
        return { url: new URL(originalValue) };
      } catch (_) {
        if (originalValue.includes('/')) {
          const [type, id] = originalValue.split('/', 2);
          return { type, id };
        }

        return { id: originalValue };
      }
    })
    .shape({
      // TODO: when yup v1 lands, do an either/or {url}/{type,id} with id required
      url: yup
        .string()
        .url()
        .optional(),
      id: yup.string().optional(),
      type: yup.string().optional(),
    })
    .noUnknown(),
  [FHIR_SEARCH_PARAMETERS.QUANTITY]: yup
    .object()
    .transform(function(value, originalValue) {
      if (this.isType(value)) return value;

      const [quantity, system, code] = originalValue.split('|', 3);
      const prefix = SEARCH_PREFIXES_ENUM.find(pref => quantity.startsWith(pref));
      const number = quantity.replace(new RegExp(`^${prefix}`), '');

      return { prefix, number, system, code };
    })
    .shape({
      prefix: yup
        .string()
        .oneOf(SEARCH_PREFIXES_ENUM)
        .nullable(),
      number: yup.number().required(),
      system: yup
        .string()
        .url()
        .nullable(),
      code: yup.string().nullable(),
    })
    .noUnknown(),
  [FHIR_SEARCH_PARAMETERS.URI]: yup
    .mixed()
    .transform(function(value, originalValue) {
      if (this.isType(value)) return value;

      try {
        return new URL(originalValue);
      } catch (_) {
        return null;
      }
    })
    .test('is-url', 'must be a URL', url => !!url),
  // [FHIR_SEARCH_PARAMETERS.COMPOSITE]: ,
};

export const INCLUDE_SCHEMA = yup
  .object()
  .transform(function(value, originalValue) {
    if (this.isType(value)) return value;

    const [resource, parameter, targetType] = originalValue.split(':', 3);
    return { resource, parameter, targetType };
  })
  .shape({
    resource: yup.string().required(),
    parameter: yup.string().required(),
    targetType: yup.string().nullable(),
  })
  .noUnknown();
