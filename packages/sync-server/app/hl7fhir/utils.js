import { Sequelize, Op } from 'sequelize';
import moment from 'moment';
import { jsonFromBase64, jsonToBase64 } from 'shared/utils/encodings';
import { InvalidParameterError } from 'shared/errors';

import { hl7ParameterTypes } from './hl7Parameters';
import { hl7PatientFields, sortableHL7PatientFields } from './hl7PatientFields';

export function getSortParameterName(sort) {
  return sort[0] === '-' ? sort.slice(1) : sort;
}

export function hl7SortToTamanu(hl7Sort, modelName) {
  // Sorts are a comma separated list of parameters
  const sorts = hl7Sort.split(',');

  // Create list of Tamanu sorts
  const tamanuSorts = sorts.map(sort => {
    // Allow a "-" at the beginning to reverse sort
    const parameter = getSortParameterName(sort);
    const direction = sort[0] === '-' ? 'DESC' : 'ASC';

    // Base parameters
    if (parameter === 'issued') return ['createdAt', direction];

    // Parse patient parameters
    if (modelName === 'Patient') {
      if (sortableHL7PatientFields.includes(parameter)) {
        const { fieldName } = hl7PatientFields[parameter];
        return [fieldName, direction];
      }
    }
    // Something went terribly wrong
    throw new InvalidParameterError(`Unrecognised sort parameter in: ${hl7Sort}`);
  });

  // Always sort by descending ID last
  tamanuSorts.push(['id', 'DESC']);

  return tamanuSorts;
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

// The date string will be parsed in UTC and return a moment
export function parseHL7Date(dateString) {
  // Only these formats should be valid for a date in HL7 FHIR:
  // https://www.hl7.org/fhir/datatypes.html#date
  return moment.utc(dateString, ['YYYY', 'YYYY-MM', 'YYYY-MM-DD'], true);
}
