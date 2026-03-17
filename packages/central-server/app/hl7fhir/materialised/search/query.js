import { last } from 'lodash';

import { FHIR_MAX_RESOURCES_PER_PAGE } from '@tamanu/constants';

import { pushToQuery } from './common';
import { generateWhereClause } from './where';
import { generateOrderClause } from './order';

/**
 * @param {*} query The request query Map (normalised)
 * @param {*} parameters The search parameters for the resource
 * @param {*} FhirResource The resource model
 * @param {ReadSettings} settings The settings reader
 */
export async function buildSearchQuery(query, parameters, FhirResource, settings) {
  const countDefault =
    (await settings.get('fhir.parameters._count.default')) || FHIR_MAX_RESOURCES_PER_PAGE;
  const sql = {
    limit: countDefault,
  };

  if (query.has('_sort')) {
    sql.order = generateOrderClause(query, parameters, FhirResource);
  }

  if (query.has('_count')) {
    const count = last(query.get('_count').flatMap(v => v.value));
    if (count === 0) {
      pushToQuery(query, '_summary', { value: ['count'] });
    } else {
      sql.limit = count;
    }
  }

  if (query.has('_page')) {
    const page = last(query.get('_page').flatMap(v => v.value));
    sql.offset = page * sql.limit;
  }

  // TODO: support _summary and _elements

  sql.where = generateWhereClause(query, parameters, FhirResource);

  return sql;
}
