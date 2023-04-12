import { last } from 'lodash';

import { FHIR_COUNT_CONFIG_DEFAULT } from 'shared/utils/fhir/parameters';

import { pushToQuery } from './common';
import { generateWhereClause } from './where';
import { generateOrderClause } from './order';

/**
 * @param {*} query The request query Map (normalised)
 * @param {*} parameters The search parameters for the resource
 * @param {*} FhirResource The resource model
 */
export function buildSearchQuery(query, parameters, FhirResource) {
  const sql = {
    limit: FHIR_COUNT_CONFIG_DEFAULT,
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

// Specifies the jsonb path without the first level (column name)
// path: ['a', 'b', '[]', 'c', '[]', 'd']
// jsonb path: '$.b[*].c[*].d'
function getJsonbPath(path) {
  const actualPath = path.slice(1).map(step => (step === '[]' ? '[*]' : `.${step}`));
  return `$${actualPath.join('')}`;
}

// Depends on the appearance of an array in its last position
function getJsonbQueryFn(path) {
  const lastElement = path[path.length - 1];
  const pathWithoutLastElement = path.slice(0, path.length - 1);
  const jsonbPath = getJsonbPath(pathWithoutLastElement);

  // path: ['a', 'b', '[]', 'c', '[]']
  // sql: jsonb_array_elements_text(jsonb_path_query(a, '$.b[*].c'))
  if (lastElement === '[]') {
    return Sequelize.fn(
      'jsonb_array_elements_text',
      Sequelize.fn('jsonb_path_query', Sequelize.col(path[0]), Sequelize.literal(`'${jsonbPath}'`)),
    );
  }

  // path: ['a', 'b', '[]', 'c', '[]', 'd']
  // sql: jsonb_extract_path_text(jsonb_path_query(a, '$.b[*].c[*]'), 'd')
  return Sequelize.fn(
    'jsonb_extract_path_text',
    Sequelize.fn('jsonb_path_query', Sequelize.col(path[0]), Sequelize.literal(`'${jsonbPath}'`)),
    lastElement,
  );
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
    return [Sequelize.col(entirePath[0]), order];
  }

  // TODO (EPI-202)
  // The generated SQL *works* and the ordering is correct and stable, with one
  // important caveat: the rows are duplicated due to the order by expression
  // returning a setof, which is expanded into mulitple rows. This is not a bug,
  // literally what this query:
  //
  // SELECT * FROM table ORDER BY setreturning_expression();
  //
  // "actually" does is:
  //
  // SELECT *, setreturning_expression() as _ordering FROM table ORDER BY _ordering;
  //
  // except it doesn't return the _ordering "output column".
  //
  // Essentially say you have users with the given names:
  //
  // 1. Albert, Charlie
  // 2. Bob, David
  //
  // and we sort by given name, we get:
  //
  // User#1 (Albert, Charlie) [sorting on: Albert]
  // User#2 (Bob, David) [sorting on: Bob]
  // User#1 (Albert, Charlie) [sorting on: Charlie]
  // User#2 (Bob, David) [sorting on: David]
  //
  // This is perfectly good and correct, but it's not what we want. We want to
  // only return each user once, and only once. Furthermore, we want to do this
  // in SQL, such that offset/limit work as expected. But we are also restricted
  // in what SQL we can do, to preserve performance characteristics.
  //
  // (Why can't we post-process? Well, what does it mean to return the 2nd page
  // when the first page (LIMIT 20) has been reduced to 10 users in post because
  // of duplicates? What does it mean to return the 12th page? Or the 200th?)
  //
  // ((Similarly, it would be impractical to use temporary tables or subqueries,
  // because the ordering is done as a last step in the query processing, and we
  // don't want to duplicate the entire table in memory just to do some dedupe
  // before applying the paging.))
  //
  // (((Why can't we return duplicates? Because the FHIR spec says we can't.
  // See https://hl7.org/fhir/search.html#entries §3.2.1.3.4)))
  throw new Unsupported('order with nested arrays is not supported yet');

  // return [getJsonbQueryFn(entirePath), order];
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
