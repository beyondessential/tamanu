import { random } from 'lodash';
import * as yup from 'yup';

import { FhirBaseType } from './baseType';

export class FhirQuantity extends FhirBaseType {
  static SCHEMA() {
    return yup
      .object({
        value: yup.number().nullable().default(null),
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
