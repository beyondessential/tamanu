import { Chance } from 'chance';
import { sample } from 'lodash';
import * as yup from 'yup';

import { Composite } from '../../utils/pgComposite';
import { FhirPeriod } from './period';

const USES = ['usual', 'official', 'temp', 'nickname', 'anonymous', 'old', 'maiden'];

export class FhirHumanName extends Composite {
  static FIELD_ORDER = ['use', 'text', 'family', 'given', 'prefix', 'suffix', 'period'];

  static SCHEMA() {
    return yup
      .object({
        use: yup
          .string()
          .oneOf([null, ...USES])
          .nullable()
          .default(null),
        text: yup
          .string()
          .nullable()
          .default(null),
        family: yup
          .string()
          .nullable()
          .default(null),
        given: yup
          .array()
          .of(yup.string())
          .nullable()
          .default([]),
        prefix: yup
          .array()
          .of(yup.string())
          .nullable()
          .default([]),
        suffix: yup
          .array()
          .of(yup.string())
          .nullable()
          .default([]),
        period: FhirPeriod.asYup()
          .nullable()
          .default(null),
      })
      .noUnknown();
  }

  static fake() {
    const chance = new Chance();
    return new this({
      use: sample(USES),
      family: chance.last(),
      given: [chance.first()],
    });
  }
}
