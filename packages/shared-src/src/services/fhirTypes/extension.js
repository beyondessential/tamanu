import * as yup from 'yup';
import { v4 as uuidv4 } from 'uuid';

import { COMPOSITE, Composite } from '../../utils/pgComposite';
import { FhirCodeableConcept } from './codeableConcept';

export class FhirExtension extends Composite {
  static FIELD_ORDER = ['url', 'valueCodeableConcept'];

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

  static validateAndTransformFromSql({ url, valueCodeableConcept, ...fields }) {
    return new this({
      url,
      valueCodeableConcept:
        valueCodeableConcept && FhirCodeableConcept.fromSql(valueCodeableConcept),
      ...fields,
    });
  }

  static fake(...args) {
    return new this({
      url: `https://tamanu.io/extension/${uuidv4()}`,
      valueCodeableConcept: FhirCodeableConcept.fake(...args),
    });
  }
}

export class FHIR_EXTENSION extends COMPOSITE {
  static ValueClass = FhirExtension;
}
