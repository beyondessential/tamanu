import * as yup from 'yup';

import { Composite } from '../../utils/pgComposite';
import { FhirCodeableConcept } from './codeableConcept';
import { FhirReference } from './reference';

export class FhirImmunizationPerformer extends Composite {
  static FIELD_ORDER = ['function', 'actor'];

  static SCHEMA() {
    return yup
      .object({
        function: FhirCodeableConcept.asYup()
          .nullable()
          .default(null),
        actor: FhirReference.asYup().required(),
      })
      .noUnknown();
  }

  static fake(...args) {
    return new this({
      function: FhirCodeableConcept.fake(...args),
      actor: FhirReference.fake(...args),
    });
  }
}
