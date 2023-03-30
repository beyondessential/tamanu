import { escapeRegExp, last } from 'lodash';
import { Op, Sequelize } from 'sequelize';
import * as yup from 'yup';

import {
  FHIR_SEARCH_PARAMETERS,
  FHIR_SEARCH_PREFIXES,
  MAX_RESOURCES_PER_PAGE,
  FHIR_SEARCH_TOKEN_TYPES,
  FHIR_DATETIME_PRECISION,
} from 'shared/constants';
import { Invalid, Unsupported, RESULT_PARAMETER_NAMES } from 'shared/utils/fhir';

export function pushToQuery(query, param, value) {
  const insert = query.get(param) ?? [];
  insert.push(value);
  query.set(param, insert);
}

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

function nestPath(path) {
  // TODO: figure out how to stick the table name on there so it survives joins
  let nested = Sequelize.col(path[0]);
  for (const level of path.slice(1)) {
    nested = Sequelize.fn(level, nested);
  }
  return nested;
}

function addUnnests(path) {
  return path.map(step => (step === '[]' ? 'unnest' : step));
}

// path: ['a', 'b', '[]', 'c', '[]', 'd']
// sql: d(unnest(c(unnest(b(a)))))
function nestWithUnnests(path) {
  return nestPath(addUnnests(path));
}

const INVERSE_OPS = new Map([
  [Op.regexp, 'OPERATOR(fhir.<~)'],
  [Op.iRegexp, 'OPERATOR(fhir.<~*)'],
  [Op.notRegexp, 'OPERATOR(fhir.<!~)'],
  [Op.notIRegexp, 'OPERATOR(fhir.<!~*)'],
  ['OPERATOR(fhir.<~)', Op.regexp],
  ['OPERATOR(fhir.<~*)', Op.iRegexp],
  ['OPERATOR(fhir.<!~)', Op.notRegexp],
  ['OPERATOR(fhir.<!~*)', Op.notIRegexp],
  [Op.gt, Op.lte],
  [Op.gte, Op.lt],
  [Op.lt, Op.gte],
  [Op.lte, Op.gt],
]);

function singleMatch(path, paramQuery, paramDef, Model) {
  return paramQuery.value.map(value => {
    const matches = typedMatch(value, paramQuery, paramDef).map(({ op, val, extraPath = [] }) => {
      const entirePath = [...path, ...extraPath];

      // optimisation in the simple case
      if (!path.includes('[]')) {
        // path: ['a', 'b', 'c']
        // sql: c(b(a)) operator value
        return Sequelize.where(nestPath(entirePath), op, val);
      }

      const escaped =
        paramDef.type === FHIR_SEARCH_PARAMETERS.NUMBER
          ? val.toString()
          : Model.sequelize.escape(val);

      // need to inverse the ops because we're writing the sql in the opposite
      // direction (match operator any(...)) instead of (value operator match)
      const inverseOp = INVERSE_OPS.get(op) ?? op;
      if (typeof inverseOp === 'string') {
        // our custom inverse regex operators don't work with sequelize, so we
        // need to write literals for them. also see:
        // https://github.com/sequelize/sequelize/issues/13011

        // see below for the expected sql. we're just writing the literal
        // instead of being able to use sequelize's utilities.
        const selector = `ANY(SELECT ${addUnnests(path).reduce(
          (acc, step) => (acc === null ? `"${step}"` : `${step}(${acc})`),
          null,
        )})`;

        return Sequelize.literal(`${escaped} ${inverseOp} ${selector}`);
      }

      // path: ['a', 'b', '[]', 'c', '[]', 'd']
      // sql: value operator any(select(d(unnest(c(unnest(b(a)))))))
      const selector = Sequelize.fn('any', Sequelize.fn('select', nestWithUnnests(entirePath)));

      return Sequelize.where(Sequelize.literal(escaped), inverseOp, selector);
    });

    return matches.length === 1 ? matches[0] : Sequelize.and(matches);
  });
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
  if (!path.includes('[]')) {
    // path: ['a', 'b', 'c']
    // sql: order by c(b(a)) desc
    return [nestPath(path), order];
  }

  // TODO (EPI-202)
  // it *does* generate sql, but it results in inconsistent or maybe random(!)
  // ordering from run to run so it's disabled for now.
  throw new Unsupported('order with nested arrays is not supported yet');

  // path: ['a', 'b', '[]', 'c', '[]', 'd']
  // sql: order by d(unnest(c(unnest(b(a)))))
  // return [nestWithUnnests(path), order];
}

function typedMatch(value, query, def) {
  switch (def.type) {
    case FHIR_SEARCH_PARAMETERS.NUMBER: {
      return [
        {
          op: prefixToOp(value.prefix),
          val: value.number,
        },
      ];
    }
    case FHIR_SEARCH_PARAMETERS.DATE: {
      switch (def.datePrecision) {
        case FHIR_DATETIME_PRECISION.DAYS:
          return [{ op: prefixToOp(value.prefix), val: value.date.sql.split(' ')[0] }];
        case FHIR_DATETIME_PRECISION.SECONDS:
          return [{ op: prefixToOp(value.prefix), val: value.date.sql }];
        default:
          throw new Unsupported(`unsupported date precision: ${def.datePrecision}`);
      }
    }
    case FHIR_SEARCH_PARAMETERS.STRING: {
      switch (query.modifier) {
        case undefined:
        case null:
        case 'starts-with':
          return [{ op: Op.iRegexp, val: `^${escapeRegExp(value)}.*` }];
        case 'ends-with':
          return [{ op: Op.iRegexp, val: `.*${escapeRegExp(value)}$` }];
        case 'contains':
          return [{ op: Op.iRegexp, val: `.*${escapeRegExp(value)}.*` }];
        case 'exact':
          return [{ op: Op.eq, val: value }];
        default:
          throw new Unsupported(`unsupported string modifier: ${query.modifier}`);
      }
    }
    case FHIR_SEARCH_PARAMETERS.TOKEN: {
      const { system, code } = value;
      switch (def.tokenType) {
        case FHIR_SEARCH_TOKEN_TYPES.CODING:
        case FHIR_SEARCH_TOKEN_TYPES.VALUE: {
          const valuePath = def.tokenType === FHIR_SEARCH_TOKEN_TYPES.VALUE ? 'value' : 'code';
          if (system && code) {
            return [
              {
                op: Op.eq,
                val: system,
                extraPath: ['system'],
              },
              {
                op: Op.eq,
                val: code,
                extraPath: [valuePath],
              },
            ];
          }

          if (system) {
            return [
              {
                op: Op.eq,
                val: system,
                extraPath: ['system'],
              },
            ];
          }

          if (code) {
            return [
              {
                op: Op.eq,
                val: code,
                extraPath: [valuePath],
              },
            ];
          }

          throw new Invalid('token searches require either or both of system|code');
        }
        case FHIR_SEARCH_TOKEN_TYPES.BOOLEAN: {
          return [
            {
              op: Op.eq,
              val: yup.boolean().validateSync(code), // just to cast it
            },
          ];
        }
        case FHIR_SEARCH_TOKEN_TYPES.PRESENCE: {
          const present = yup.boolean().validateSync(code);
          return [
            {
              op: present ? Op.not : Op.is,
              val: null,
            },
          ];
        }
        case FHIR_SEARCH_TOKEN_TYPES.STRING: {
          return [
            {
              op: Op.eq,
              val: code,
            },
          ];
        }
        default:
          throw new Unsupported(`unsupported search token type ${def.tokenType}`);
      }
    }
    default:
      throw new Unsupported(`unsupported search type ${def.type}`);
  }
}

function prefixToOp(prefix) {
  switch (prefix) {
    case null:
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
      throw new Unsupported(`unsupported search prefix: ${prefix}`);
  }
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
