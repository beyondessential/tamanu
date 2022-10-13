import { sample } from 'lodash';
import * as yup from 'yup';

import { COMPOSITE, Composite } from '../../utils/pgComposite';
import { FhirReference } from './reference';

const TYPES = ['replaced-by', 'replaces', 'refer', 'seealso'];

export class FhirPatientLink extends Composite {
  static FIELD_ORDER = ['other', 'type'];

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

  static validateAndTransformFromSql({ other, ...fields }) {
    return new this({
      other: other && FhirReference.fromSql(other),
      ...fields,
    });
  }

  static fake(model, { fieldName }, id) {
    return new this({
      type: sample(TYPES),
      other: FhirReference.fake(model, { fieldName }, id),
    });
  }
}

export class FHIR_PATIENT_LINK extends COMPOSITE {
  static ValueClass = FhirPatientLink;
}
