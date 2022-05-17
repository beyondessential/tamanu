import { Sequelize, Op } from 'sequelize';
import * as yup from 'yup';
import moment from 'moment';
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

// Prefixes supported by Tamanu with the corresponding
// sequelize operators. Classified by HL7 search parameter type.
const prefixes = {
  [hl7ParameterTypes.date]: {
    eq: Op.eq,
  },
  [hl7ParameterTypes.string]: {
    eq: Op.eq,
    co: Op.substring,
    sw: Op.startsWith,
    ew: Op.endsWith,
  },
  [hl7ParameterTypes.token]: {
    eq: Op.eq,
  },
};

const dateTypePrefixes = Object.keys(prefixes[hl7ParameterTypes.date]);
const stringTypePrefixes = Object.keys(prefixes[hl7ParameterTypes.string]);
const tokenTypePrefixes = Object.keys(prefixes[hl7ParameterTypes.token]);

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

const stringTypeModifiers = Object.keys(modifiers[hl7ParameterTypes.string]);

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
    supportedPrefixes: stringTypePrefixes,
    validationSchema: yup.string(),
  },
  family: {
    parameterType: hl7ParameterTypes.string,
    fieldName: 'lastName',
    columnName: 'last_name',
    supportedModifiers: stringTypeModifiers,
    supportedPrefixes: stringTypePrefixes,
    validationSchema: yup.string(),
  },
  gender: {
    parameterType: hl7ParameterTypes.token,
    fieldName: 'sex',
    columnName: 'sex',
    supportedModifiers: [],
    supportedPrefixes: tokenTypePrefixes,
    validationSchema: yup.string().oneOf(['male', 'female', 'other']),
  },
  birthdate: {
    parameterType: hl7ParameterTypes.date,
    fieldName: 'dateOfBirth',
    columnName: 'date_of_birth',
    supportedModifiers: [],
    supportedPrefixes: dateTypePrefixes,
    validationSchema: yup
      .string()
      // eslint-disable-next-line no-template-curly-in-string
      .test('is-valid-date', 'Invalid date/time format: ${value}', value => {
        if (!value) return true;
        // Only these formats should be valid for a date in HL7 FHIR:
        // https://www.hl7.org/fhir/datatypes.html#date
        return moment(value, ['YYYY', 'YYYY-MM', 'YYYY-MM-DD'], true).isValid();
      }),
  },
  // TODO: address should match a bunch of other fields
  address: {
    parameterType: hl7ParameterTypes.string,
    fieldName: 'additionalData.cityTown',
    columnName: 'additionalData.city_town',
    supportedModifiers: stringTypeModifiers,
    supportedPrefixes: stringTypePrefixes,
    validationSchema: yup.string(),
  },
  'address-city': {
    parameterType: hl7ParameterTypes.string,
    fieldName: 'additionalData.cityTown',
    columnName: 'additionalData.city_town',
    supportedModifiers: stringTypeModifiers,
    supportedPrefixes: stringTypePrefixes,
    validationSchema: yup.string(),
  },
  // TODO: telecom could also be email or other phones
  telecom: {
    parameterType: hl7ParameterTypes.token,
    fieldName: '$additionalData.primary_contact_number$',
    columnName: 'additionalData.primary_contact_number',
    supportedModifiers: [],
    supportedPrefixes: tokenTypePrefixes,
    validationSchema: yup.string(),
  },
};

// Parser utility for HL7 FHIR _filter parameter.
// Divides expressions around logic operators.
// Returns an object with two arrays:
// expressions (strings) and logic (sequelize operators).
export function getExpressionsAndLogic(_filter) {
  const expressions = _filter.split(/ and | or /);
  const logicStrings = _filter.match(/ and | or /g) || [];

  // Logic operators can only be ' and ' || ' or ', replace them with sequelize operators
  const logicOperators = logicStrings.map(str => {
    if (str === ' and ') return Op.and;
    if (str === ' or ') return Op.or;
    throw new Error(`Cannot convert operator ${str} when parsing _filter parameter.`);
  });

  return { expressions, logic: logicOperators };
}

// Gets a group of filters and nests them according to
// the query logic, avoiding unnecessary nests.
export function nestFilters(filters, logic, index = 0) {
  // If logic is empty, recursion will be infinite. Also,
  // filters.length should equal logic.length + 1 to work properly.
  if (logic.length === 0 || logic.length + 1 !== filters.length) {
    throw new Error('Function nestFilters called with bad arguments');
  }

  // Use local copy of index to be able to reassign it
  let currentIndex = index;

  // Look ahead and include all filters with the same logic operator
  const currentOp = logic[currentIndex];
  const content = [];
  for (; currentIndex <= logic.length - 1; currentIndex++) {
    // Include current filter to content
    content.push(filters[currentIndex]);

    // Stop if the next logic operator doesn't match
    const nextOp = logic[currentIndex + 1];
    if (currentOp !== nextOp) {
      break;
    }
  }

  // Base case: last element
  if (currentIndex === logic.length - 1) {
    // Filters length is equal to logic length + 1
    content.push(filters[logic.length]);
  } else {
    // Include nested elements to content
    content.push(nestFilters(filters, logic, currentIndex + 1));
  }

  return { [currentOp]: content };
}

// This function parses and validates the _filter param. Returns null if _filter
// is undefined. If its valid, it will return a sequelize where clause,
// otherwise will throw a ValidationError.
export function getFilterFromParam(_filter, resourceFields = {}) {
  // Nothing to parse
  if (_filter === undefined) {
    return null;
  }

  const filters = [];
  const invalidExpressions = [];
  const { expressions, logic } = getExpressionsAndLogic(_filter);

  // Convert all expressions to filters
  expressions.forEach(expression => {
    // Parse expression: separated by any number of whitespace
    // or default to empty array (to be able to destructure it)
    const [parameter, prefix, value] = expression.match(/".+"|\S+/g) || [];

    // Get parameter options or default to empty object (to be able to destructure it)
    const parameterOptions = resourceFields[parameter] || {};
    const { fieldName, supportedPrefixes, parameterType } = parameterOptions;

    // Make sure expression is valid and keep track of invalid ones
    if (
      !parameter ||
      !prefix ||
      !value ||
      parameter in resourceFields === false ||
      supportedPrefixes.includes(prefix) === false ||
      prefix in prefixes[parameterType] === false
    ) {
      invalidExpressions.push(`"${expression}"`);
      return;
    }

    // Get actual operator and strip value of double quotes (") wrapper if it exists
    const operator = prefixes[parameterType][prefix];
    const unquotedValue = value.match(/^".+"$/) ? value.replace(/"/g, '') : value;

    // Create and add filter
    filters.push({ [fieldName]: { [operator]: unquotedValue } });
  });

  // Query should fail if any expression is invalid
  if (invalidExpressions.length !== 0) {
    throw new yup.ValidationError(
      `Invalid expressions in _filter: ${invalidExpressions.join(', ')}`,
    );
  }

  // Nest filters if there is any filtering logic, otherwise
  // we can assume we only have one filter and should return that.
  return logic.length === 0 ? filters[0] : nestFilters(filters, logic);
}
