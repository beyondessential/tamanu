import { object } from 'yup';

export class Composite {
  static SCHEMA = object();
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
