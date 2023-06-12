import { Sequelize } from 'sequelize';
import { FHIR_SEARCH_PARAMETERS, FHIR_SEARCH_TOKEN_TYPES } from 'shared/constants';

import { findField } from './common';
import { getJsonbQueryFn } from './jsonb';

export function generateOrderClause(query, parameters, FhirResource) {
  let ordering = [];

  for (const { order, by } of query.get('_sort').flatMap(v => v.value)) {
    const def = parameters.get(by);
    if (def.path.length === 0) continue;

    const alternates = def.path.map(([field, ...path]) => {
      const resolvedPath = [findField(FhirResource, field).field, ...path];
      return singleOrder(resolvedPath, order, def, FhirResource);
    });

    ordering = ordering.concat(alternates);
  }

  return ordering;
}

// eslint-disable-next-line no-unused-vars
function singleOrder(path, order, def, _Model) {
  const entirePath = path;
  if (
    def.type === FHIR_SEARCH_PARAMETERS.TOKEN &&
    (def.tokenType === FHIR_SEARCH_TOKEN_TYPES.CODING ||
      def.tokenType === FHIR_SEARCH_TOKEN_TYPES.VALUE)
  ) {
    const valuePath = def.tokenType === FHIR_SEARCH_TOKEN_TYPES.VALUE ? 'value' : 'code';
    entirePath.push(valuePath);
  }

  // optimisation in the simple case
  if (entirePath.length === 1) {
    return [Sequelize.col(entirePath[0]), `${order} NULLS LAST`];
  }

  return [getJsonbQueryFn(entirePath), `${order} NULLS LAST`];
}
