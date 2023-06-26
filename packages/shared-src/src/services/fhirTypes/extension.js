import * as yup from 'yup';
import { v4 as uuidv4 } from 'uuid';

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
      url: `https://tamanu.io/extension/${uuidv4()}`,
      valueCodeableConcept: FhirCodeableConcept.fake(...args),
    });
  }
}
