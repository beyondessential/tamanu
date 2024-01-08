import * as yup from 'yup';
import config from 'config';

import {
  FHIR_SEARCH_PARAMETERS,
  FHIR_SEARCH_TOKEN_TYPES,
  FHIR_DATETIME_PRECISION,
  FHIR_MAX_RESOURCES_PER_PAGE,
} from '@tamanu/constants';

import { DEFAULT_SCHEMA_FOR_TYPE, INCLUDE_SCHEMA } from './schemata';

// Extract config values with a fallback
// FHIR_COUNT_CONFIG_MAX needs to be at least as big as the default
const FHIR_COUNT_CONFIG = config?.integrations?.fhir?.parameters?._count || {};
export const FHIR_COUNT_CONFIG_DEFAULT = FHIR_COUNT_CONFIG?.default || FHIR_MAX_RESOURCES_PER_PAGE;
const FHIR_COUNT_CONFIG_MAX = Math.max(FHIR_COUNT_CONFIG?.max || 0, FHIR_COUNT_CONFIG_DEFAULT);

if (config?.integrations?.fhir?.enabled && FHIR_COUNT_CONFIG_DEFAULT > FHIR_COUNT_CONFIG?.max) {
  // eslint-disable-next-line no-console
  console.warn('FHIR _count config default value is bigger than the max.');
}

export function normaliseParameter([key, param], overrides = {}) {
  const defaultSchema = DEFAULT_SCHEMA_FOR_TYPE[param.type];
  const norm = {
    path: [[key]],
    sortable: true,
    parameterSchema:
      typeof param.parameterSchema === 'function'
        ? param.parameterSchema(defaultSchema || yup)
        : defaultSchema,
    ...param,
    ...overrides,
  };

  if (param.type === FHIR_SEARCH_PARAMETERS.TOKEN && !norm.tokenType) {
    norm.tokenType = FHIR_SEARCH_TOKEN_TYPES.CODING;
  }

  if (param.type === FHIR_SEARCH_PARAMETERS.DATE && !norm.datePrecision) {
    norm.datePrecision = FHIR_DATETIME_PRECISION.SECONDS;
  }

  return [key, norm];
}

export const RESULT_PARAMETERS = {
  _total: {
    type: FHIR_SEARCH_PARAMETERS.SPECIAL,
    parameterSchema: yup.string().oneOf(['none', 'estimate', 'accurate']),
  },
  _summary: {
    type: FHIR_SEARCH_PARAMETERS.SPECIAL,
    parameterSchema: yup.string().oneOf(['true', 'text', 'data', 'count', 'false']),
  },
  _count: {
    type: FHIR_SEARCH_PARAMETERS.SPECIAL,
    parameterSchema: yup
      .number()
      .integer()
      .min(0) // equivalent to _summary=count
      .max(FHIR_COUNT_CONFIG_MAX)
      .default(FHIR_COUNT_CONFIG_DEFAULT),
  },
  _page: {
    type: FHIR_SEARCH_PARAMETERS.SPECIAL,
    parameterSchema: yup
      .number()
      .integer()
      .min(0)
      .default(0),
  },
  _include: {
    type: FHIR_SEARCH_PARAMETERS.SPECIAL,
    parameterSchema: INCLUDE_SCHEMA,
  },
  _revinclude: {
    type: FHIR_SEARCH_PARAMETERS.SPECIAL,
    parameterSchema: INCLUDE_SCHEMA,
  },
};

export const RESULT_PARAMETER_NAMES = ['_sort', ...Object.keys(RESULT_PARAMETERS)];

function sortParameter(sortableParameters) {
  return {
    _sort: {
      type: FHIR_SEARCH_PARAMETERS.SPECIAL,
      parameterSchema: yup
        .object()
        .transform(function sortParse(value, originalValue) {
          if (this.isType(value)) return value;

          if (originalValue.startsWith('-')) {
            return {
              order: 'DESC',
              by: originalValue.replace(/^-/, ''),
            };
          }

          return {
            order: 'ASC',
            by: originalValue,
          };
        })
        .shape({
          order: yup
            .string()
            .oneOf(['ASC', 'DESC'])
            .required(),
          by: yup
            .string()
            .oneOf(
              ['_score', ...sortableParameters.map(([k]) => k)],
              '_sort key is not an allowed value',
            )
            .required(),
        })
        .noUnknown(),
    },
  };
}

const cache = new Map();

export function normaliseParameters(FhirResource) {
  const cacheKey = FhirResource.fhirName;
  if (!cacheKey) {
    throw new Error('DEV: not a proper Resource');
  }

  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const resourceParameters = Object.entries(FhirResource.searchParameters()).map(
    normaliseParameter,
  );
  // eslint-disable-next-line no-unused-vars
  const sortableParameters = resourceParameters.filter(([_, v]) => v.sortable);

  const resultParameters = Object.entries({
    ...sortParameter(sortableParameters),
    ...RESULT_PARAMETERS,
  }).map(param =>
    normaliseParameter(param, {
      path: [],
      sortable: false,
    }),
  );

  const parameters = new Map([...resourceParameters, ...resultParameters]);
  cache.set(cacheKey, parameters);
  return parameters;
}
