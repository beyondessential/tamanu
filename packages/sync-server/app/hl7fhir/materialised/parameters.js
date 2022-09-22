import * as yup from 'yup';

import { FHIR_SEARCH_PARAMETERS, FHIR_MAX_RESOURCES_PER_PAGE } from 'shared/constants';

import { DEFAULT_SCHEMA_FOR_TYPE, INCLUDE_SCHEMA } from './schemata';

function normaliseParameter([key, param], overrides = {}) {
  const defaultSchema = DEFAULT_SCHEMA_FOR_TYPE[param.type];
  const norm = {
    path: [[key]],
    sortable: true,
    parameterSchema:
      typeof param.parameterSchema === 'function'
        ? param.parameterSchema(defaultSchema ?? yup)
        : defaultSchema,
    ...param,
    ...overrides,
  };

  return [key, norm];
}

const RESULT_PARAMETERS = {
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
      .max(FHIR_MAX_RESOURCES_PER_PAGE)
      .default(FHIR_MAX_RESOURCES_PER_PAGE),
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

function sortParameter(sortableParameters) {
  return {
    _sort: {
      type: FHIR_SEARCH_PARAMETERS.SPECIAL,
      parameterSchema: yup
        .object()
        .transform(function(value, originalValue) {
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
            .oneOf(['_score', ...sortableParameters.map(([k]) => k)])
            .required(),
        })
        .noUnknown(),
    },
  };
}

export function normaliseParameters(FhirResource) {
  const resourceParameters = Object.entries(FhirResource.searchParameters()).map(
    normaliseParameter,
  );
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

  return new Map([...resourceParameters, ...resultParameters]);
}
