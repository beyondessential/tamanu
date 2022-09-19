import { Chance } from 'chance';
import { sample } from 'lodash';
import array from 'postgres-array';
import * as yup from 'yup';

import { COMPOSITE, Composite } from '../../utils/pgComposite';
import { FhirPeriod } from './period';

const USES = ['usual', 'official', 'temp', 'nickname', 'anonymous', 'old', 'maiden'];

export class FhirHumanName extends Composite {
  static FIELD_ORDER = ['use', 'text', 'family', 'given', 'suffix', 'prefix', 'period'];
  static SCHEMA = yup
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

  static validateAndTransformFromSql({ given, prefix, suffix, period, ...fields }) {
    const noop = x => x;

    return new this({
      given: given && array.parse(given, noop),
      prefix: prefix && array.parse(prefix, noop),
      suffix: suffix && array.parse(suffix, noop),
      period: period && FhirPeriod.fromSql(period),
      ...fields,
    });
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

export class FHIR_HUMAN_NAME extends COMPOSITE {
  static ValueClass = FhirHumanName;
}
