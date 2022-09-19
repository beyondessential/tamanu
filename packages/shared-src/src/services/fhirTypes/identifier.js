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
        .oneOf([null, ...USES])
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
      // could also be a reference (per spec) but we're using text
      assigner: yup
        .string()
        .nullable()
        .default(null),
    })
    .noUnknown();

  static validateAndTransformFromSql({ period, ...fields }) {
    return new this({
      period: period && FhirPeriod.fromSql(period),
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
