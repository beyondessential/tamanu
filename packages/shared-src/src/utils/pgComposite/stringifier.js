/* global WeakRef */
// https://github.com/eslint/eslint/issues/13602

import { Utils } from 'sequelize';
import { formatISO9075 } from 'date-fns';
import { Composite } from './sequelizeType';

let QUERY_GENERATOR;
/**
 * Registers the Sequelize instance's dialect QueryGenerator, so that its quote() function can be
 * used by composite stringifiers.
 *
 * Keeps a WeakRef, so as to not prevent garbage collection of Sequelize.
 */
export function setupQuote(sequelizeInstance) {
  QUERY_GENERATOR = new WeakRef(sequelizeInstance.connectionManager.dialect.queryGenerator);
}

/**
 * The quote function from the Sequelize dialect QueryGenerator.
 *
 * This must be set up via the setupQuote() function before use.
 */
function quote(value) {
  return QUERY_GENERATOR.deref().quote(value);
}

/**
 * Implements composite record literal syntax from
 * https://www.postgresql.org/docs/current/rowtypes.html#ROWTYPES-IO-SYNTAX
 *
 * The fields passed here should not be escaped/quoted, due to the specifics of the record syntax.
 *
 * This does *not* do the final quoting to pass as a string, which is taken care of by Sequelize.
 */
export function compositeToSql(fieldSet) {
  return `(${fieldSet.map(compositeField).join(',')})`;
}

function compositeField(field) {
  switch (typeof field) {
    case 'number':
    case 'boolean':
    case 'bigint':
      return field.toString();
    case 'undefined':
      return '';
    case 'string':
    case 'symbol':
      return compositeString(field);
    case 'function':
      return compositeField(field());
    case 'object': {
      if (field === null) {
        // > A completely empty field value (no characters at all between the commas or parentheses)
        // > represents a NULL.
        return '';
      }

      if (Array.isArray(field)) {
        return compositeString(arrayToSql(field));
      }

      if (field instanceof Composite) {
        return compositeString(compositeToSql(field.sqlFields()));
      }

      if (field instanceof Date) {
        return compositeString(formatISO9075(field));
      }

      if (
        field instanceof Utils.Fn ||
        field instanceof Utils.Col ||
        field instanceof Utils.Literal ||
        field instanceof Utils.Fn ||
        field instanceof Utils.Json ||
        field instanceof Utils.Cast
      ) {
        return compositeString(quote(field));
      }

      throw new Error(`unsupported type to stringify to composite: ${field.constructor}`);
    }
    default:
      throw new Error(`unknown typeof return value: ${typeof field}`);
  }
}

function compositeString(string) {
  // > When writing a composite value you can write double quotes around any individual field value.
  // > You *must* do so if the field value would otherwise confuse the composite-value parser. In
  // > particular, fields containing parentheses, commas, double quotes, or backslashes must be
  // > double-quoted. To put a double quote or backslash in a quoted composite field value, precede
  // > it with a backslash.

  // Let's do this simply by double-quoting everything.
  return `"${string.replaceAll(/(\\|")/g, c => `\\${c}`)}"`;
}

function arrayToSql(arr) {
  return `{${arr.map(a => compositeField(a)).join(',')}}`;
}
