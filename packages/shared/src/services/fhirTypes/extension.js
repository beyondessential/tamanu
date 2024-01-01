import * as yup from 'yup';

import { FhirCodeableConcept } from './codeableConcept';
import { FhirBaseType } from './baseType';

export class FhirExtension extends FhirBaseType {
  static SCHEMA() {
    return yup
      .object({
        url: yup
          .string()
          .url()
          .required(),
        valueCodeableConcept: FhirCodeableConcept.asYup()
          .nullable()
          .default(null),
      })
      .noUnknown();
  }

  static fake(...args) {
    return new this({
      url: `https://tamanu.io/extension/${crypto.randomUUID()}`,
      valueCodeableConcept: FhirCodeableConcept.fake(...args),
    });
  }
}
