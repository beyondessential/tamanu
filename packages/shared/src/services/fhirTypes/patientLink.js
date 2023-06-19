import { sample } from 'lodash';
import * as yup from 'yup';

import { FhirBaseType } from './baseType';
import { FhirReference } from './reference';

const TYPES = ['replaced-by', 'replaces', 'refer', 'seealso'];

export class FhirPatientLink extends FhirBaseType {
  static SCHEMA() {
    return yup
      .object({
        other: FhirReference.asYup().required(),
        type: yup
          .string()
          .oneOf([null, ...TYPES])
          .required(),
      })
      .noUnknown();
  }

  static fake(model, { fieldName }, id) {
    return new this({
      type: sample(TYPES),
      other: FhirReference.fake(model, { fieldName }, id),
    });
  }
}
