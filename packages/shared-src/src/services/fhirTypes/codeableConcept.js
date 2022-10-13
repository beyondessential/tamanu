import { random } from 'lodash';
import array from 'postgres-array';
import * as yup from 'yup';

import { COMPOSITE, Composite } from '../../utils/pgComposite';
import { FhirCoding } from './coding';

export class FhirCodeableConcept extends Composite {
  static FIELD_ORDER = ['coding', 'text'];

  static SCHEMA() {
    return yup
      .object({
        coding: yup
          .array()
          .of(FhirCoding.asYup())
          .nullable()
          .default([]),
        text: yup
          .string()
          .nullable()
          .default(null),
      })
      .noUnknown();
  }

  static validateAndTransformFromSql({ coding, ...fields }) {
    return new this({
      coding: coding && array.parse(coding, el => FhirCoding.fromSql(el)),
      ...fields,
    });
  }

  static fake(...args) {
    const coding = Array(random(0, 3))
      .fill(0)
      .map(() => FhirCoding.fake(...args));

    return new this({
      coding,
      text: coding.map(c => c.params.display).join(' '),
    });
  }
}

export class FHIR_CODEABLE_CONCEPT extends COMPOSITE {
  static ValueClass = FhirCodeableConcept;
}
