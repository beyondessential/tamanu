import { snakeCase } from 'lodash';
import { DataTypes, ValidationError } from 'sequelize';
import { compositeToSql } from './stringifier';
import { Composite } from './sequelizeType';

const ABSTRACT = DataTypes.ABSTRACT.prototype.constructor;
export class COMPOSITE extends ABSTRACT {
  static ValueClass;

  static get key() {
    return this.name;
  }

  static get pgName() {
    return `fhir.${snakeCase(this.ValueClass.fhirName)}`;
  }

  constructor(options) {
    super();
    this.options = options || {};
    this.key = this.constructor.key;

    // we need to do this to tightly bind `this` in the functions; Sequelize rebinds _methods to the
    // MODEL which loses all the valuable context such as "how do I parse this value" but whatever,
    // we just force it to the right thing.
    this._stringify = this._value = (value, options) => compositeToSql(this.fieldSet(value), options);
    this._sanitize = (value, options) => {
      if (value instanceof Composite) {
        // sometimes sequelize gives us an already parsed and valid value to sanitize.
        return value;
      }

      if (value === null) {
        // if one day we need to parse null values specially, revisit this (or revisit life choices)
        return null;
      }

      console.log({klass: this.constructor.name, value, options, hasValueClass: !!this.constructor.ValueClass});
      return this.constructor.ValueClass.fromSql(value, options);
    }
  }

  toSql() {
    return this.constructor.pgName;
  }

  validate(value) {
    if (value instanceof this.constructor.ValueClass) return true;
    throw new ValidationError(`value is not a ${this.constructor.ValueClass}`, []);
  }

  fieldSet(value) {
    return value instanceof this.constructor.ValueClass
      ? value.sqlFields()
      : new this.constructor.ValueClass(value).sqlFields();
  }
}
