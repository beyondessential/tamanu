import asyncHandler from 'express-async-handler';
import { Unsupported } from './errors';
import { normaliseParameters, RESULT_PARAMETER_NAMES } from './parameters';

export function resourceHandler() {
  return asyncHandler(async (req, res) => {
    const method = req.method;
    if (method != 'GET') throw new Unsupported('methods other than get are not supported');

    const path = req.path.split('/').slice(1);
    if (path.length > 1) throw new Unsupported('nested paths are not supported');

    const FhirResource = req.store.models[`Fhir${path[0]}`];
    if (!FhirResource) throw new Unsupported('this resource is not supported');

    const parameters = normaliseParameters(FhirResource);
    const { query } = parseRequest(req, parameters);
    
    const sqlQuery = buildQuery(query, parameters, FhirResource);
    const total = await FhirResource.count(sqlQuery);

    res.send({
      total,
      sqlQuery,
      query: [...query],
    });
  });
}

function parseRequest(req, parameters) {
  const method = req.method;
  const path = req.path.split('/').slice(1);
  const query = new Map(Object.entries(req.query).map(([name, value]) => {
    const [param, ...modifiers] = name.split(':');
    if (!parameters.has(param)) throw new Unsupported(`parameter is not supported: ${param}`);

    return [param, {
      modifiers,
      value: value.split(',').map(part => parameters.get(param).parameterSchema.validateSync(part)),
    }];
  }));

  return { method, path, query };
}

import { Op, Sequelize } from 'sequelize';
import { FHIR_SEARCH_PARAMETERS, FHIR_SEARCH_PREFIXES } from 'shared/constants';
import { inspect } from 'node:util';

function buildQuery(query, parameters, FhirResource) {
  const sql = {};
  if (query.has('_sort')) {
    sql.order = query.get('_sort').value.map(({ order, by }) => [by, order]);
  }

  const andWhere = [];
  for (const [name, paramQuery] of query.entries()) {
    if (RESULT_PARAMETER_NAMES.includes(name)) continue;

    const def = parameters.get(name);
    if (def.path.length === 0) continue;
    
    const alternatives = def.path.flatMap(path => singleMatch(path, paramQuery, def));
    console.log(alternatives);
    andWhere.push({ [Op.or]: alternatives });
  }
  sql.where = { [Op.and]: andWhere };

  return sql;
}

function singleMatch(path, paramQuery, paramDef) {
  const matches = paramQuery.value.map(value => typedMatch(value, paramQuery, paramDef));
  
  if (!path.includes('[]')) {
    // path: ['a', 'b', 'c']
    // sql: c(b(a)) operator value
    return matches.map(({ op, val }) => ({
      // doesn't work ([val] is not the col)
      [val]: { [op]: nestPath(path) },
    }));
  }

  const runs = pathRuns(path);
  if (runs.length !== 2) {
    throw new Error('cant do that yet');
  }

  // path: ['a', 'b', '[]', 'c', 'd']
  // sql: value operator any(select(d(c(unnest(b(a))))))
  const [inner, outer] = runs;
  const selector = Sequelize.fn('any', Sequelize.fn('select', nestPath([
    ...inner,
    'unnest',
    ...outer,
  ])));

  return matches.map(({ op, val }) => ({
    [val]: { [op]: selector }
  }));
}

function typedMatch(value, query, def) {
  const [mod] = query.modifiers; // currently only support zero or one modifier
  console.log({ value, mod, def });

  switch (def.type) {
    // TODO: query.modifiers
    case FHIR_SEARCH_PARAMETERS.DATE:
      return {
        op: prefixToOp(value.prefix),
        val: value.date,
      };
    case FHIR_SEARCH_PARAMETERS.STRING: {
      switch (mod) {
        case undefined:
        case null:
          return { op: Op.startsWith, val: value };
        case 'contains':
          return { op: Op.iLike, val: `%${value}%` };
        case 'exact':
          return { op: Op.eq, val: value };
        default:
          throw new Unsupported(`unsupported string modifier: ${mod}`);
      }
    }
  }
}

function prefixToOp(prefix) {
  switch (prefix) {
    case FHIR_SEARCH_PREFIXES.EQ:
      return Op.eq;
    case FHIR_SEARCH_PREFIXES.NE:
      return Op.ne;
    case FHIR_SEARCH_PREFIXES.LT:
      return Op.lt;
    case FHIR_SEARCH_PREFIXES.GT:
      return Op.gt;
    case FHIR_SEARCH_PREFIXES.LE:
      return Op.lte;
    case FHIR_SEARCH_PREFIXES.GE:
      return Op.gte;
    default:
      throw new Unsupported(`unsupported prefix: ${prefix}`);
  }
}

function nestPath(path) {
  console.log(path);
  let nested = Sequelize.col(path[0]);
  for (const level of path.slice(1)) {
    nested = Sequelize.fn(level, nested);
  }
  return nested;
}

function pathRuns(path) {
  const runs = [];
  let run = [];

  for (const bit of path) {
    if (bit === '[]') {
      runs.push(run);
      run = [];
    } else {
      run.push(bit);
    }
  }

  runs.push(run);
  return runs;
}