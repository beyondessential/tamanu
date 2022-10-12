import { sample } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import * as yup from 'yup';

import { COMPOSITE, Composite } from '../../utils/pgComposite';
import { FhirCodeableConcept } from './codeableConcept';
import { FhirPeriod } from './period';
import { FhirReference } from './reference';

const USES = ['usual', 'official', 'temp', 'secondary', 'old'];

export class FhirIdentifier extends Composite {
  static FIELD_ORDER = ['use', 'type', 'system', 'value', 'period', 'assigner'];

  static SCHEMA() {
    return yup
      .object({
        use: yup
          .string()
          .oneOf([null, ...USES])
          .nullable()
          .default(null),
        type: FhirCodeableConcept.asYup()
          .nullable()
          .default(null),
        system: yup
          .string()
          .url()
          .nullable()
          .default(null),
        value: yup
          .string()
          .nullable()
          .default(null),
        period: FhirPeriod.asYup()
          .nullable()
          .default(null),
        assigner: FhirReference.asYup()
          .nullable()
          .default(null),
      })
      .noUnknown();
  }

  static validateAndTransformFromSql({ type, period, assigner, ...fields }) {
    return new this({
      type: type && FhirCodeableConcept.fromSql(type),
      period: period && FhirPeriod.fromSql(period),
      assigner: assigner && FhirReference.fromSql(assigner),
      ...fields,
    });
  }

  static fake(model, { fieldName }, id) {
    return new this({
      use: sample(USES),
      system: `https://tamanu.io/${model.name}/${uuidv4()}`,
      value: `${fieldName}.${id}`,
    });
  }
}

export class FHIR_IDENTIFIER extends COMPOSITE {
  static ValueClass = FhirIdentifier;
}
