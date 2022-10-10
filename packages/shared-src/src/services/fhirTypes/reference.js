import * as yup from 'yup';

import { COMPOSITE, Composite } from '../../utils/pgComposite';
import { FhirIdentifier } from './identifier';

export class FhirReference extends Composite {
  static FIELD_ORDER = ['reference', 'type', 'identifier', 'display'];

  static SCHEMA = yup
    .object({
      reference: yup
        .string()
        .nullable()
        .default(null),
      type: yup
        .string()
        .url()
        .nullable()
        .default(null),
      identifier: FhirIdentifier.asYup()
        .nullable()
        .default(null),
      display: yup
        .string()
        .nullable()
        .default(null),
    })
    .noUnknown();

  static validateAndTransformFromSql({ identifier, ...fields }) {
    return new this({
      identifier: identifier && FhirIdentifier.fromSql(identifier),
      ...fields,
    });
  }

  static fake(model, { fieldName }, id) {
    return new this({
      type: `http://hl7.org/fhir/resource-types/${model}`,
      display: `${fieldName}.${id}`,
    });
  }
}

export class FHIR_REFERENCE extends COMPOSITE {
  static ValueClass = FhirReference;
}
