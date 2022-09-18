import { object, mixed } from 'yup';
import { enumerate, parse } from './parse';

export class Composite {
  static SCHEMA = object();
  static FIELD_ORDER = [];

  constructor(params) {
    this.params = this.constructor.SCHEMA.validateSync(params);
  }

  sqlFields() {
    return this.constructor.FIELD_ORDER.map(name => this.params[name]);
  }

  /**
   * Implements a parser for a composite record literal. Unlike the stringifier, we can't take the
   * easy route; we have to implement parsing of values as they'll come back from Postgres.
   *
   * The parser starts by reading every field as a string, then does more passes to interpret them.
   */
  static fromSql(raw) {
    const fields = parse(raw);
    if (fields.length !== this.FIELD_ORDER.length) {
      throw new Error(
        `wrong amount of fields for composite: expected ${this.FIELD_ORDER.length}, found ${fields.length}\nRAW: ${raw}`,
      );
    }

    const assembled = {};
    for (const [n, name] of enumerate(this.FIELD_ORDER)) {
      assembled[name] = fields[n];
    }

    return new this(assembled);
  }

  /**
   * Use when wanting to use this type in another yup schema.
   *
   * Sets things up to check the type and also to parse from sql when called from within fromSql.
   */
  static asYup() {
    return mixed()
      .transform((value, originalValue) =>
        typeof value === 'string' ? this.fromSql(originalValue) : value,
      )
      .test('is-fhir-type', `must be a ${this.name}`, t => (t ? t instanceof this : true));
  }

  static fake() {
    throw new Error('Must be overridden');
  }
}
