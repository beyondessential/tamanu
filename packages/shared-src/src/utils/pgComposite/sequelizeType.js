import { object, mixed } from 'yup';
import { enumerate, parse } from './parse';

export class Composite {
  static SCHEMA() {
    return object();
  }

  static FIELD_ORDER = [];

  static get fhirName() {
    return this.name.replace(/^Fhir/, '');
  }

  constructor(params) {
    this.params = this.constructor.SCHEMA().validateSync(params);
  }

  sqlFields() {
    return this.constructor.FIELD_ORDER.map(name => this.params[name]);
  }

  asFhir() {
    return objectAsFhir(this.params);
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
      .transform((value, originalValue) =>
        typeof value === 'string' ? this.fromSql(originalValue) : value,
      )
      .test('is-fhir-type', `must be a ${this.name}`, t => (t ? t instanceof this : true));
  }

  static fake() {
    throw new Error('Must be overridden');
  }
}

export function objectAsFhir(input) {
  const obj = {};
  for (const [name, value] of Object.entries(input)) {
    const val = valueAsFhir(value);
    if (val === null || val === undefined) continue;
    obj[name] = val;
  }
  return obj;
}

export function valueAsFhir(value) {
  if (Array.isArray(value)) {
    return value.map(val => valueAsFhir(val));
  }

  if (value instanceof Composite) {
    return value.asFhir();
  }

  return value;
}
