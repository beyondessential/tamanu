import { object, mixed } from 'yup';
import { enumerate, parse } from './parse';

export class Composite {
  static SCHEMA() {
    return object();
  }

  static FIELD_ORDER = [];

  constructor(params) {
    const withoutNulls = Object.fromEntries(
      Object.entries(params).filter(([, value]) => value !== null && value !== undefined),
    );
    const validatedParams = this.constructor.SCHEMA().validateSync(withoutNulls);

    for (const [name, value] of Object.entries(validatedParams)) {
      // exclude phantom fields (used only for advanced yup validations)
      if (name.startsWith('_') === false) {
        this[name] = value;
      }
    }
  }

  sqlFields() {
    return this.constructor.FIELD_ORDER.map(name => this[name]);
  }

  /**
   * Parses a composite record literal. Unlike the stringifier, we can't take the easy route; we
   * have to implement parsing of values as they'll come back from Postgres.
   */
  static fromSql(raw) {
    const fields = parse(raw);

    const fieldOrderLength = (this.FIELD_ORDER || {}).length;
    if (typeof fields.length === 'number' && fields.length !== fieldOrderLength) {
      throw new Error(
        `wrong amount of fields for composite ${this.name}: expected ${fieldOrderLength}, found ${fields.length}\nRAW: ${raw}`,
      );
    }

    const assembled = {};
    for (const [n, name] of enumerate(this.FIELD_ORDER)) {
      assembled[name] = fields[n];
    }

    return this.validateAndTransformFromSql(assembled);
  }

  // override this if you want to customise parsing
  static validateAndTransformFromSql(fields) {
    return new this(fields);
  }

  /**
   * Use when wanting to use this type in another yup schema.
   *
   * Sets things up to check the type and also to parse from sql when called from within fromSql.
   */
  static asYup() {
    return mixed()
      .transform((value, originalValue) => {
        if (typeof value === 'string') return this.fromSql(originalValue);
        if (typeof value === 'object' && !(value instanceof this)) return new this(value);
        return value;
      })
      .test('is-composite-type', `must be a ${this.name}`, t => (t ? t instanceof this : true));
  }

  static fake() {
    throw new Error('Must be overridden');
  }
}
