import { sample } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import * as yup from 'yup';

import { COMPOSITE, Composite } from '../../utils/pgComposite';
import { FhirPeriod } from './period';

const USES = ['usual', 'official', 'temp', 'secondary', 'old'];

export class FhirIdentifier extends Composite {
  static FIELD_ORDER = ['use', 'system', 'value', 'period', 'assigner'];
  static SCHEMA = yup
    .object({
      use: yup
        .string()
        .oneOf(USES)
        .nullable()
        .default(null),
      system: yup
        .string()
        .nullable()
        .default(null),
      value: yup
        .string()
        .nullable()
        .default(null),
      period: yup
        .mixed()
        .test('is-fhir-period', 'must be a FhirPeriod', t => (t ? t instanceof FhirPeriod : true))
        .nullable()
        .default(null),
      // could also be a reference (per spec) but we're using text
      assigner: yup
        .string()
        .nullable()
        .default(null),
    })
    .noUnknown();

  static fake(model, { fieldName }, id) {
    return new this({
      use: sample(USES),
      system: `${model.name}.${uuidv4()}`,
      value: `${fieldName}.${id}`,
    });
  }
}

export class FHIR_IDENTIFIER extends COMPOSITE {
  static ValueClass = FhirIdentifier;
}
