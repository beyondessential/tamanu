import { escapeRegExp } from 'lodash';
import { Op, Sequelize } from 'sequelize';
import * as yup from 'yup';

import {
  FHIR_SEARCH_PARAMETERS,
  FHIR_SEARCH_PREFIXES,
  FHIR_SEARCH_TOKEN_TYPES,
  FHIR_DATETIME_PRECISION,
} from '@tamanu/constants';
import { Invalid, Unsupported, RESULT_PARAMETER_NAMES } from 'shared/utils/fhir';

import { findField } from './common';
import { getJsonbPath, getJsonbQueryFn } from './jsonb';

export function generateWhereClause(query, parameters, FhirResource) {
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
  return { [Op.and]: andWhere };
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
export function singleMatch(path, paramQuery, paramDef, Model) {
  return paramQuery.value.map(value => {
    const matches = typedMatch(value, paramQuery, paramDef).map(({ op, val, extraPath = [] }) => {
      const entirePath = [...path, ...extraPath];

      // optimisation in the simple case
      if (entirePath.length === 1) {
        return Sequelize.where(Sequelize.col(entirePath[0]), op, val);
      }

      const escaped =
        paramDef.type === FHIR_SEARCH_PARAMETERS.NUMBER
          ? val.toString()
          : Model.sequelize.escape(val);

      // the JSONB queries below are quite complex, and postgres' query planner
      // can't figure out how to optimise them. so we help it out by adding a
      // boolean condition that will let it use a GIN index as a pre-scan filter
      const optimisingCondition = `"${entirePath[0]}" @? '${getJsonbPath(entirePath)}'`;

      // need to inverse the ops because we're writing the sql in the opposite
      // direction (match operator any(...)) instead of (value operator match)
      const inverseOp = INVERSE_OPS.get(op) ?? op;
      if (typeof inverseOp === 'string') {
        // our custom inverse regex operators don't work with sequelize, so we
        // need to write literals for them. also see:
        // https://github.com/sequelize/sequelize/issues/13011
        // we're just writing the literal
        // instead of being able to use sequelize's utilities.
        // path: ['a', 'b', '[]', 'c', '[]', 'd']
        // sql: value operator ANY(SELECT jsonb_path_query(a, '$.b[*].c[*].d') #>> '{}');
        const selector = `ANY(SELECT jsonb_path_query(${entirePath[0]}, '${getJsonbPath(
          entirePath,
        )}') #>> '{}')`;

        return Sequelize.literal(`${escaped} ${inverseOp} ${selector} AND ${optimisingCondition}`);
      }

      // while #>> works regardless of the jsonb path, using
      // explicit function names needs different treatment.
      const selector = Sequelize.fn('any', Sequelize.fn('select', getJsonbQueryFn(entirePath)));
      return Sequelize.and([
        // actual comparison
        Sequelize.where(Sequelize.literal(escaped), inverseOp, selector),
        Sequelize.literal(optimisingCondition),
      ]);
    });

    return matches.length === 1 ? matches[0] : Sequelize.and(matches);
  });
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
