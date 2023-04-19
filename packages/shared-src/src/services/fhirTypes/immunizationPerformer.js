import * as yup from 'yup';

import { COMPOSITE, Composite } from '../../utils/pgComposite';
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

  static validateAndTransformFromSql({ function: functionField, actor }) {
    return new this({
      function: functionField && FhirCodeableConcept.fromSql(functionField),
      actor: actor && FhirReference.fromSql(actor),
    });
  }

  static fake(...args) {
    return new this({
      function: FhirCodeableConcept.fake(...args),
      actor: FhirReference.fake(...args),
    });
  }
}

export class FHIR_IMMUNIZATION_PERFORMER extends COMPOSITE {
  static ValueClass = FhirImmunizationPerformer;
}
