import { last } from 'lodash';
import { Op, Sequelize } from 'sequelize';
import {
  FHIR_SEARCH_PARAMETERS,
  FHIR_SEARCH_PREFIXES,
  MAX_RESOURCES_PER_PAGE,
} from 'shared/constants';

import { Unsupported } from './errors';
import { RESULT_PARAMETER_NAMES } from './parameters';

export function pushToQuery(query, param, value) {
  const insert = query.get(param) ?? [];
  insert.push(value);
  query.set(param, insert);
}

export function buildQuery(query, parameters, FhirResource) {
  const sql = {
    limit: MAX_RESOURCES_PER_PAGE,
  };

  if (query.has('_sort')) {
    const ordering = [];
    for (const { order, by } of query.get('_sort').flatMap(v => v.value)) {
      const def = parameters.get(by);
      if (def.path.length === 0) continue;

      const alternates = def.path.map(([field, ...path]) => {
        const resolvedPath = [findField(FhirResource, field).field, ...path];
        return singleOrder(resolvedPath, order, def, FhirResource);
      });

      ordering.push(...alternates);
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

function singleMatch(path, paramQuery, paramDef, Model) {
  const matches = paramQuery.value.map(value => typedMatch(value, paramQuery, paramDef));

  if (!path.includes('[]')) {
    // path: ['a', 'b', 'c']
    // sql: c(b(a)) operator value
    return matches.map(({ op, val }) => Sequelize.where(nestPath(path), op, val));
  }

  const runs = pathRuns(path);
  if (runs.length !== 2) {
    throw new Error('cant do that yet');
  }

  // path: ['a', 'b', '[]', 'c', 'd']
  // sql: value operator any(select(d(c(unnest(b(a))))))
  const [inner, outer] = runs;
  const selector = Sequelize.fn(
    'any',
    Sequelize.fn('select', nestPath([...inner, 'unnest', ...outer])),
  );

  return matches.map(({ op, val }) => {
    const escaped =
      paramDef.type === FHIR_SEARCH_PARAMETERS.NUMBER
        ? val.toString()
        : Model.sequelize.escape(val);
    return Sequelize.where(Sequelize.literal(escaped), op, selector);
  });
}

function singleOrder(path, order, paramDef, Model) {
  if (!path.includes('[]')) {
    // path: ['a', 'b', 'c']
    // sql: order by c(b(a)) desc
    return [nestPath(path), order];
  }

  const runs = pathRuns(path);
  if (runs.length > 1) {
    throw new Error('cant do that yet');
  }
}

function typedMatch(value, query, def) {
  switch (def.type) {
    case FHIR_SEARCH_PARAMETERS.NUMBER:
      return {
        op: prefixToOp(value.prefix),
        val: value.number,
      };
    case FHIR_SEARCH_PARAMETERS.DATE:
      return {
        op: prefixToOp(value.prefix),
        val: value.date.sql,
      };
    case FHIR_SEARCH_PARAMETERS.STRING: {
      switch (query.modifier) {
        case undefined:
        case null:
        case 'starts-with':
          // FIXME: does this actually do startsWith?
          return { op: Op.startsWith, val: value };
        case 'ends-with':
          return { op: Op.endsWith, val: value };
        case 'contains':
          return { op: Op.iLike, val: `%${value}%` };
        case 'exact':
          return { op: Op.eq, val: value };
        default:
          throw new Unsupported(`unsupported string modifier: ${query.modifier}`);
      }
    }
    default:
      throw new Unsupported(`TODO: unsupported type ${def.type}`);
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
  // TODO: figure out how to stick the table name on there so it survives joins
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

// fetch the sequelize field definition
// generally want the .field value for the in-sql column name
function findField(Model, field) {
  if (Model.rawAttributes && Model.rawAttributes[field]) {
    return Model.rawAttributes[field];
  }

  if (Model.fieldRawAttributesMap && Model.fieldRawAttributesMap[field]) {
    return Model.fieldRawAttributesMap[field];
  }

  return field;
}
