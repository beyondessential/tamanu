import { snakeCase } from 'lodash';
import { DataTypes, Utils } from 'sequelize';
import util from 'util';
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

  fieldSet(value, options) {
    if (value instanceof this.constructor.ValueClass) {
      return value.sqlFields(options);
    } else {
      return new this.constructor.ValueClass(value).sqlFields(options);
    }
  }

  _stringify(value, options) {
    return `(${this.fieldSet(value, options).join(',')})`;
  }

  _value(value, options) {
    return `(${this.fieldSet(value, options).join(',')})`;
  }

  static parse(value, options) {
    return this.ValueClass.fromSql(value, options);
  }
}

export class Composite {
  static SCHEMA = yup.object();
  static FIELD_ORDER = [];

  constructor(params) {
    this.params = this.constructor.SCHEMA.validateSync(params);
  }

  sqlFields(options) {
    return this.constructor.FIELD_ORDER.map(name => options.escape(this.params[name]));
  }

  static fromSql(value) {
  const iter = (typeof args === 'object')
    return value;
  }

  static fake() {
    throw new Error('Must be overridden');
  }
}
