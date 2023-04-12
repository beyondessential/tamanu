import { last } from 'lodash';
import { Op } from 'sequelize';

import { MAX_RESOURCES_PER_PAGE } from 'shared/constants';
import { RESULT_PARAMETER_NAMES } from 'shared/utils/fhir';

import { findField, singleMatch } from './match';
import { singleOrder } from './order';

export function pushToQuery(query, param, value) {
  const insert = query.get(param) ?? [];
  insert.push(value);
  query.set(param, insert);
}

/**
 * @param {*} query The request query Map (normalised)
 * @param {*} parameters The search parameters for the resource
 * @param {*} FhirResource The resource model
 */
export function buildSearchQuery(query, parameters, FhirResource) {
  const sql = {
    limit: MAX_RESOURCES_PER_PAGE,
  };

  if (query.has('_sort')) {
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
    sql.order = ordering;
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

  const andWhere = [];
  for (const [name, paramQueries] of query.entries()) {
    if (RESULT_PARAMETER_NAMES.includes(name)) continue;

    const def = parameters.get(name);
    if (def.path.length === 0) continue;

    for (const paramQuery of paramQueries) {
      const alternates = def.path.flatMap(([field, ...path]) => {
        const resolvedPath = [findField(FhirResource, field).field, ...path];
        return singleMatch(resolvedPath, paramQuery, def, FhirResource);
      });

      andWhere.push({ [Op.or]: alternates });
    }
  }
  sql.where = { [Op.and]: andWhere };

  return sql;
}
