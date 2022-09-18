import { snakeCase } from 'lodash';
import { DataTypes, Utils } from 'sequelize';
import { formatISO9075 } from 'date-fns';
import * as yup from 'yup';

/**
 * Register a new type with sequelize.
 * CANNOT register an extension of an existing sequelize type (like STRING, etc).
 * Only use with fully-new types.
 */
export function newPgDataType(Klass) {
  const name = Klass.key;
  DataTypes[name] = Utils.classToInvokable(Klass);
  DataTypes[name].types.postgres = [Klass.pgName];
}

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
  return `"${string.replace('"', '\\"').replace('\\', '\\\\')}"`;
}

const ABSTRACT = DataTypes.ABSTRACT.prototype.constructor;
export class COMPOSITE extends ABSTRACT {
  static ValueClass;

  static get key() {
    return this.name;
  }

  static get pgName() {
    return `fhir.${snakeCase(this.ValueClass.name.replace(/^Fhir/, ''))}`;
  }

  constructor(options) {
    super();
    this.options = options || {};
    this.key = this.constructor.key;
  }

  toSql() {
    return this.constructor.pgName;
  }

  validate(value) {
    if (value instanceof this.constructor.ValueClass) return true;
    throw new ValidationError(`value is not a ${this.constructor.ValueClass}`);
  }

  fieldSet(value) {
    if (value instanceof this.constructor.ValueClass) {
      return value.sqlFields();
    } else {
      return new this.constructor.ValueClass(value).sqlFields();
    }
  }

  _stringify(value, options) {
    return compositeToSql(this.fieldSet(value), options);
  }

  _value(value, options) {
    return compositeToSql(this.fieldSet(value), options);
  }

  _sanitize(value, options) {
    return this.constructor.ValueClass.fromSql(value, options);
  }
}

export class Composite {
  static SCHEMA = yup.object();
  static FIELD_ORDER = [];

  constructor(params) {
    this.params = this.constructor.SCHEMA.validateSync(params);
  }

  sqlFields() {
    return this.constructor.FIELD_ORDER.map(name => this.params[name]);
  }

  static fromSql(value) {
    console.error({ fromSql: value });
    return value;
  }

  static fake() {
    throw new Error('Must be overridden');
  }
}
