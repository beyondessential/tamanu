import { random } from 'es-toolkit/compat';
import * as yup from 'yup';

import { FHIR_QUANTITY_COMPARATOR } from '@tamanu/constants';

import { FhirBaseType } from './baseType';

export class FhirQuantity extends FhirBaseType {
  static SCHEMA() {
    return yup
      .object({
        value: yup.number().nullable().default(null),
        comparator: yup
          .string()
          .oneOf([...Object.values(FHIR_QUANTITY_COMPARATOR), null])
          .nullable()
          .default(null),
        unit: yup.string().nullable().default(null),
        system: yup.string().nullable().default(null),
        code: yup.string().nullable().default(null),
      })
      .noUnknown();
  }

  static fake() {
    return new this({
      value: random(1, 100),
      unit: 'g',
    });
  }
}
