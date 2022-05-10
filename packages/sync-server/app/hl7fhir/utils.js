import { Sequelize, Op } from 'sequelize';
import { jsonFromBase64, jsonToBase64 } from 'shared/utils/encodings';

export function hl7SortToTamanu(hl7Sort) {
  // hl7Sort can be quite complicated, we only support a single field `issued` in `-` order
  if (hl7Sort === '-issued') {
    return [
      ['createdAt', 'DESC'],
      ['id', 'DESC'],
    ];
  }
  throw new Error(`Unrecognised sort order: ${hl7Sort}`);
}

export function decodeIdentifier(identifier) {
  if (typeof identifier !== 'string') {
    return [null, null];
  }
  const [namespace, ...idPieces] = identifier.split('|');
  return [namespace || null, idPieces.join('|') || null];
}

export function toSearchId({ after, ...params }) {
  const result = { ...params };
  if (after) {
    result.after = {
      createdAt: after.createdAt.toISOString(),
      id: after.id,
    };
  }
  return jsonToBase64(result);
}

export function fromSearchId(cursor) {
  // leave it to parseQuery to validate params
  return jsonFromBase64(cursor);
}

export function addPaginationToWhere(where, after) {
  if (!after) {
    return where;
  }
  // once we add more than a single order this will be more complicated
  return {
    [Op.and]: [
      where,
      {
        [Op.or]: [
          {
            createdAt: { [Op.lt]: after.createdAt.toISOString() },
          },
          {
            createdAt: { [Op.eq]: after.createdAt.toISOString() },
            id: { [Op.lt]: after.id },
          },
        ],
      },
    ],
  };
}

// HL7 query parameters might have modifiers,
// this will split them into an array.
export function getParamAndModifier(fullParam) {
  return fullParam.split(':', 2);
}

// Prefixes supported by Tamanu with the corresponding
// sequelize operators.
// TODO: remove eslint line when adding support to prefixes
// eslint-disable-next-line no-unused-vars
const prefixes = {
  eq: Op.eq,
  co: Op.substring,
  sw: Op.startsWith,
  ew: Op.endsWith,
};

// Modifiers supported by Tamanu with the corresponding
// sequelize operator.
const modifiers = {
  contains: Op.substring,
  'starts-with': Op.startsWith,
  'ends-with': Op.endsWith,
  exact: Op.eq,
};

export const stringTypeModifiers = ['contains', 'starts-with', 'ends-with', 'exact'];

// Helper function that returns a sequelize operator or equality by default
export function getOperator(modifier, supportedModifiers) {
  if (modifier && supportedModifiers.includes(modifier) && modifier in modifiers) {
    return modifiers[modifier];
  }

  return Op.eq;
}

// Helper function to deal with case insensitive searches for strings
export function getQueryObject(columnName, value, operator, modifier, caseSensitive) {
  // Exact fields should be case sensitive
  if (modifier === 'exact' || typeof value !== 'string' || caseSensitive) {
    return { [operator]: value };
  }

  // Perform case insensitive search by using SQL function UPPER
  // and modifying the string to be uppercase.
  return Sequelize.where(Sequelize.fn('upper', Sequelize.col(columnName)), {
    [operator]: value.toUpperCase(),
  });
}
