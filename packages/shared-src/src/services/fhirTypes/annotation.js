import * as yup from 'yup';

import { COMPOSITE, Composite } from '../../utils/pgComposite';
import { fakeString } from '../../test-helpers/fake';
import { FhirReference } from './reference';

export class FhirAnnotation extends Composite {
  static FIELD_ORDER = ['authorReference', 'authorString', 'time', 'text'];

  static SCHEMA() {
    return yup
      .object({
        authorReference: FhirReference.asYup()
          .nullable()
          .default(null),
        authorString: yup
          .string()
          .nullable()
          .default(null),
        time: yup
          .date()
          .nullable()
          .default(null),
        text: yup.string().required(),
        _exclusive: bool().when(['authorReference', 'authorString'], {
          is: (name, path) => !!name && !!path,
          then: bool().required(
            'Only one of authorReference or authorString are allowed, but not both.',
          ),
          otherwise: bool(),
        }),
      })
      .noUnknown();
  }

  static validateAndTransformFromSql({ authorReference, time, ...fields }) {
    return new this({
      authorReference: authorReference && FhirReference.fromSql(authorReference),
      time: time && new Date(time),
      ...fields,
    });
  }

  static fake(model, { fieldName }, id) {
    return new this({
      authorString: fakeString(model, { fieldName: `${fieldName}.author` }, id),
      time: new Date(),
      text: fakeString(model, { fieldName: `${fieldName}.text` }, id),
    });
  }
}

export class FHIR_ANNOTATION extends COMPOSITE {
  static ValueClass = FhirAnnotation;
}
