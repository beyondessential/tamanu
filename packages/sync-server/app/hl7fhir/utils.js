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
/*
const prefixes = {
  eq: Op.eq,
  co: Op.substring,
  sw: Op.startsWith,
  ew: Op.endsWith,
};
*/

// All of the HL7 search parameter types
export const hl7ParameterTypes = {
  number: 'number',
  date: 'date',
  string: 'string',
  token: 'token',
  reference: 'reference',
  composite: 'composite',
  quantity: 'quantity',
  uri: 'uri',
  special: 'special',
};

// Modifiers supported by Tamanu with the corresponding
// sequelize operator. Classified by HL7 search parameter type.
export const modifiers = {
  [hl7ParameterTypes.string]: {
    contains: Op.substring,
    'starts-with': Op.startsWith,
    'ends-with': Op.endsWith,
    exact: Op.eq,
  },
};

export const stringTypeModifiers = Object.keys(modifiers.string);

export function getDefaultOperator(type) {
  if (type === hl7ParameterTypes.string) {
    return Op.startsWith;
  }

  return Op.eq;
}

// Helper function to deal with case insensitive searches for strings
export function getQueryObject(columnName, value, operator, modifier, parameterType) {
  // String searches should be case insensitive unless the modifier is "exact"
  if (parameterType === hl7ParameterTypes.string && modifier !== 'exact') {
    // Perform case insensitive search by using SQL function UPPER
    // and modifying the string to be uppercase.
    return Sequelize.where(Sequelize.fn('upper', Sequelize.col(columnName)), {
      [operator]: value.toUpperCase(),
    });
  }

  return { [operator]: value };
}

// HL7 Patient resource mapping to Tamanu.
// (only supported params are in)
export const hl7PatientFields = {
  given: {
    parameterType: hl7ParameterTypes.string,
    fieldName: 'firstName',
    columnName: 'first_name',
    supportedModifiers: stringTypeModifiers,
  },
  family: {
    parameterType: hl7ParameterTypes.string,
    fieldName: 'lastName',
    columnName: 'last_name',
    supportedModifiers: stringTypeModifiers,
  },
  gender: {
    parameterType: hl7ParameterTypes.token,
    fieldName: 'sex',
    columnName: 'sex',
    supportedModifiers: [],
  },
  birthdate: {
    parameterType: hl7ParameterTypes.date,
    fieldName: 'dateOfBirth',
    columnName: 'date_of_birth',
    supportedModifiers: [],
  },
  // TODO: address should match a bunch of other fields
  address: {
    parameterType: hl7ParameterTypes.string,
    fieldName: 'additionalData.cityTown',
    columnName: 'additionalData.city_town',
    supportedModifiers: stringTypeModifiers,
  },
  'address-city': {
    parameterType: hl7ParameterTypes.string,
    fieldName: 'additionalData.cityTown',
    columnName: 'additionalData.city_town',
    supportedModifiers: stringTypeModifiers,
  },
  // TODO: telecom could also be email or other phones
  telecom: {
    parameterType: hl7ParameterTypes.token,
    fieldName: '$additionalData.primary_contact_number$',
    columnName: 'additionalData.primary_contact_number',
    supportedModifiers: [],
  },
};
