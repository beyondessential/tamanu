import { object, mixed } from 'yup';

export class FhirBaseType {
  static SCHEMA() {
    return object();
  }

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

  /**
   * Use when wanting to use this type in another yup schema.
   *
   * Sets things up to check the type.
   */
  static asYup() {
    return mixed()
      .transform(value => {
        if (typeof value === 'object' && !(value instanceof this)) return new this(value);
        return value;
      })
      .test('is-fhir-type', `must be a ${this.name}`, t => (t ? t instanceof this : true));
  }

  static fake() {
    throw new Error('Must be overridden');
  }
}
