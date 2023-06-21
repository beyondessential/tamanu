import { random } from 'lodash';
import * as yup from 'yup';

import { FhirBaseType } from './baseType';
import { FhirCoding } from './coding';

export class FhirCodeableConcept extends FhirBaseType {
  static SCHEMA() {
    return yup
      .object({
        coding: yup
          .array()
          .of(FhirCoding.asYup())
          .nullable()
          .default([]),
        text: yup
          .string()
          .nullable()
          .default(null),
      })
      .noUnknown();
  }

  static fake(...args) {
    const coding = Array(random(0, 3))
      .fill(0)
      .map(() => FhirCoding.fake(...args));

    return new this({
      coding,
      text: coding.map(c => c.display).join(' '),
    });
  }
}
