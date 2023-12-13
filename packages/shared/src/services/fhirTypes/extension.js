import { v4 as uuidv4 } from 'uuid';
import * as yup from 'yup';

import { FhirBaseType } from './baseType';
import { FhirCodeableConcept } from './codeableConcept';

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
      url: `https://tamanu.io/extension/${uuidv4()}`,
      valueCodeableConcept: FhirCodeableConcept.fake(...args),
    });
  }
}
