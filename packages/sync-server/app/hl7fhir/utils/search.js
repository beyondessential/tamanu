import { Sequelize, Op } from 'sequelize';
import { FHIR_SEARCH_PARAMETERS } from '@tamanu/constants';
import { jsonFromBase64, jsonToBase64 } from 'shared/utils/encodings';
import { InvalidParameterError } from 'shared/errors';
import { toDateString } from 'shared/utils/dateTime';

import {
  endOfDay,
  endOfMonth,
  endOfYear,
  isMatch,
  startOfDay,
  startOfMonth,
  startOfYear,
} from 'date-fns';

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

// HL7 query parameters might have modifiers,
// this will split them into an array.
export function getParamAndModifier(fullParam) {
  return fullParam.split(':', 2);
}

export function getDefaultOperator(type) {
  if (type === FHIR_SEARCH_PARAMETERS.STRING) {
    return Op.startsWith;
  }
  if (type === FHIR_SEARCH_PARAMETERS.DATE) {
    return Op.between;
  }

  return Op.eq;
}

// Helper function to deal with case insensitive searches for strings
export function getQueryObject(columnName, value, operator, modifier, parameterType) {
  // String searches should be case insensitive unless the modifier is "exact"
  if (parameterType === FHIR_SEARCH_PARAMETERS.STRING && modifier !== 'exact') {
    // Perform case insensitive search by using SQL function UPPER
    // and modifying the string to be uppercase.
    return Sequelize.where(Sequelize.fn('upper', Sequelize.col(columnName)), {
      [operator]: value.toUpperCase(),
    });
  }

  // Dates with eq modifier or no modifier should be looked up as a range
  if (parameterType === FHIR_SEARCH_PARAMETERS.DATE && ['eq', undefined].includes(modifier)) {
    // Create and return range
    const [startOf, endOf] = getStartEndOfFns(value);
    const startDate = startOf(parseHL7Date(value));
    const endDate = endOf(parseHL7Date(value));

    if (['date_of_birth', 'date_of_death'].includes(columnName)) {
      return { [operator]: [toDateString(startDate), toDateString(endDate)] };
    }

    return { [operator]: [startDate, endDate] };
  }

  return { [operator]: value };
}

// The date string will be parsed in UTC and return a date
export function parseHL7Date(dateString) {
  // Only  yyyy, yyyy-MM, or yyyy-MM-dd formats should be valid for a date in HL7 FHIR:
  // https://www.hl7.org/fhir/datatypes.html#date
  if (isMatch(dateString, 'yyyy') || isMatch('yyyy-MM') || isMatch('yyyy-MM-dd')) {
    return new Date(dateString);
  }
  return NaN;
}

// Returns the smallest time unit used on the date string format.
// Only supports HL7 formats.
export function getStartEndOfFns(dateString) {
  switch (dateString.length) {
    case 4:
      return [startOfYear, endOfYear];
    case 7:
      return [startOfMonth, endOfMonth];
    case 10:
      return [startOfDay, endOfDay];
    default:
      throw new InvalidParameterError(`Invalid date/time format: ${dateString}`);
  }
}

/*
  References can have three different formats:
  - id
  - type/id
  - Resource URL

  This function extracts and returns the id in each case.
  Read more: http://hl7.org/fhir/search.html#reference
*/
export function parseHL7Reference(reference) {
  const params = reference.split('/');
  return params[params.length - 1];
}
