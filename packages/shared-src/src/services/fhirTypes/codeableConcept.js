import { random } from 'lodash';
import * as yup from 'yup';

import { COMPOSITE, Composite } from '../../utils/pgComposite';
import { FhirCoding } from './coding';

export class FhirCodeableConcept extends Composite {
  static FIELD_ORDER = ['coding', 'text'];
  static SCHEMA = yup
    .object({
      coding: yup
        .array()
        .of(FhirCoding.asYup())
        .ensure(),
      text: yup
        .string()
        .nullable()
        .default(null),
    })
    .noUnknown();

  static fake(...args) {
    const coding = Array(random(0, 3)).fill(0).map(() => FhirCoding.fake(...args));
    return new this({
      coding,
      text: coding.map(c => c.params.display).join(' '),
    });
  }
}

export class FHIR_CODEABLE_CONCEPT extends COMPOSITE {
  static ValueClass = FhirCodeableConcept;
}
