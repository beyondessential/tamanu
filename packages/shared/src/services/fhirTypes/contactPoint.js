import { random, sample } from 'lodash';
import * as yup from 'yup';

import { FhirBaseType } from './baseType';
import { FhirPeriod } from './period';

const SYSTEMS = ['phone', 'fax', 'email', 'pager', 'url', 'sms', 'other'];
const USES = ['home', 'work', 'temp', 'old', 'mobile'];

export class FhirContactPoint extends FhirBaseType {
  static SCHEMA() {
    return yup
      .object({
        system: yup
          .string()
          .oneOf([null, ...SYSTEMS])
          .nullable()
          .default(null),
        value: yup
          .string()
          .nullable()
          .default(null),
        use: yup
          .string()
          .oneOf([null, ...USES])
          .nullable()
          .default(null),
        rank: yup
          .number()
          .positive()
          .integer()
          .min(1)
          .nullable()
          .default(null),
        period: FhirPeriod.asYup()
          .nullable()
          .default(null),
      })
      .noUnknown();
  }

  static fake(model, { fieldName }, id) {
    return new this({
      system: sample(SYSTEMS),
      value: `${model.name}.${fieldName}.${id}`,
      use: sample(USES),
      rank: random(1, 10),
    });
  }
}
