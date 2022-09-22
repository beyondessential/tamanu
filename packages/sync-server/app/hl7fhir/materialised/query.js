import { Op, Sequelize } from 'sequelize';
import { FHIR_SEARCH_PARAMETERS, FHIR_SEARCH_PREFIXES, MAX_RESOURCES_PER_PAGE } from 'shared/constants';

import { Unsupported } from './errors';
import { RESULT_PARAMETER_NAMES } from './parameters';

export function buildQuery(query, parameters, FhirResource) {
  const sql = {};
  if (query.has('_sort')) {
    sql.order = query
      .get('_sort')
      .value.map(({ order, by }) => [findField(FhirResource, by).field, order]);
  }

  sql.limit = query.get('_count')?.value[0] ?? MAX_RESOURCES_PER_PAGE;

  const andWhere = [];
  for (const [name, paramQuery] of query.entries()) {
    if (RESULT_PARAMETER_NAMES.includes(name)) continue;

    const def = parameters.get(name);
    if (def.path.length === 0) continue;

    const alternates = def.path.flatMap(([field, ...path]) => {
      const resolvedPath = [findField(FhirResource, field).field, ...path];
      return singleMatch(resolvedPath, paramQuery, def, FhirResource);
    });

    andWhere.push({ [Op.or]: alternates });
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

function typedMatch(value, query, def) {
  const [mod] = query.modifiers; // currently only support zero or one modifier
  switch (def.type) {
    case FHIR_SEARCH_PARAMETERS.NUMBER:
      return {
        op: prefixToOp(value.prefix),
        val: value.number,
      };
    case FHIR_SEARCH_PARAMETERS.DATE:
      return {
        op: prefixToOp(value.prefix),
        val: value.date,
      };
    case FHIR_SEARCH_PARAMETERS.STRING: {
      switch (mod) {
        case undefined:
        case null:
        case 'starts-with':
          return { op: Op.startsWith, val: value };
        case 'ends-with':
          return { op: Op.endsWith, val: value };
        case 'contains':
          return { op: Op.iLike, val: `%${value}%` };
        case 'exact':
          return { op: Op.eq, val: value };
        default:
          throw new Unsupported(`unsupported string modifier: ${mod}`);
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
