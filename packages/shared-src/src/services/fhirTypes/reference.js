import * as yup from 'yup';

import { FhirBaseType } from './baseType';
// eslint-disable-next-line import/no-cycle
import { FhirIdentifier } from './identifier';

export class FhirReference extends FhirBaseType {
  static SCHEMA() {
    return yup
      .object({
        reference: yup
          .string()
          .nullable()
          .default(null),

        // In spec's schema, this is of type "uri", but it is later
        // mentioned that it can be `"Patient"` as a shorthand, so
        // it can't be the `url()` type in yup.
        type: yup
          .string()
          .nullable()
          .default(null),

        identifier: FhirIdentifier.asYup()
          .nullable()
          .default(null),
        display: yup
          .string()
          .nullable()
          .default(null),
      })
      .noUnknown();
  }

  static fake(model, { fieldName }, id) {
    return new this({
      type: model,
      display: `${fieldName}.${id}`,
    });
  }
}
