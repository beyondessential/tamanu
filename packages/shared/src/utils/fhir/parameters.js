import * as yup from 'yup';

import {
  FHIR_DATETIME_PRECISION,
  FHIR_MAX_RESOURCES_PER_PAGE,
  FHIR_SEARCH_PARAMETERS,
  FHIR_SEARCH_TOKEN_TYPES,
} from '@tamanu/constants';

import { DEFAULT_SCHEMA_FOR_TYPE, INCLUDE_SCHEMA } from './schemata';

async function getCountSettings(settings) {
  const { default: settingsDefault, max: settingsMax } = settings
    ? await settings.get('fhir.parameters._count')
    : {};
  return {
    default: settingsDefault || FHIR_MAX_RESOURCES_PER_PAGE,
    max: Math.max(settingsMax || 0, settingsDefault || FHIR_MAX_RESOURCES_PER_PAGE),
  };
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

const RESULT_PARAMETER_NAMES = ['_total', '_summary', '_count', '_page', '_include', '_revinclude'];

async function getResultParameters(settings) {
  const count = await getCountSettings(settings);
  return {
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
        .max(count.max)
        .default(count.default),
    },
    _page: {
      type: FHIR_SEARCH_PARAMETERS.SPECIAL,
      parameterSchema: yup.number().integer().min(0).default(0),
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
}

export function getResultParameterNames() {
  return ['_sort', ...RESULT_PARAMETER_NAMES];
}

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
          order: yup.string().oneOf(['ASC', 'DESC']).required(),
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

const resourceParamCache = new Map();

export async function normaliseParameters(FhirResource, settings) {
  const cacheKey = FhirResource.fhirName;
  if (!cacheKey) {
    throw new Error('DEV: not a proper Resource');
  }

  let { resourceParameters, sortableParameters } = resourceParamCache.get(cacheKey) ?? {};
  if (!resourceParameters) {
    resourceParameters = Object.entries(FhirResource.searchParameters()).map(normaliseParameter);
    // eslint-disable-next-line no-unused-vars
    sortableParameters = resourceParameters.filter(([_, v]) => v.sortable);
    resourceParamCache.set(cacheKey, { resourceParameters, sortableParameters });
  }

  const resultParameters = Object.entries({
    ...sortParameter(sortableParameters),
    ...(await getResultParameters(settings)),
  }).map(param =>
    normaliseParameter(param, {
      path: [],
      sortable: false,
    }),
  );

  return new Map([...resourceParameters, ...resultParameters]);
}
