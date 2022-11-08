import { snakeCase } from 'lodash';
import { DataTypes, ValidationError } from 'sequelize';
import { compositeToSql } from './stringifier';

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
