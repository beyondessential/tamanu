import { sample } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import * as yup from 'yup';

import { FhirBaseType } from './baseType';
import { FhirCodeableConcept } from './codeableConcept';
import { FhirPeriod } from './period';
// eslint-disable-next-line import/no-cycle
import { FhirReference } from './reference';

const USES = ['usual', 'official', 'temp', 'secondary', 'old'];

export class FhirIdentifier extends FhirBaseType {
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

  static fake(model, { fieldName }, id) {
    return new this({
      use: sample(USES),
      system: `https://tamanu.io/${model.name}/${uuidv4()}`,
      value: `${fieldName}.${id}`,
    });
  }
}
