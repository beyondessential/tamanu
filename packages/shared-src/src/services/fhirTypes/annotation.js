import * as yup from 'yup';

import { COMPOSITE, Composite } from '../../utils/pgComposite';
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
        _exclusive: yup.bool().when(['authorReference', 'authorString'], {
          is: (name, path) => !!name && !!path,
          then: yup
            .bool()
            .required('Only one of authorReference or authorString are allowed, but not both.'),
          otherwise: yup.bool(),
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
      authorString: `${model.name}.${fieldName}.author.${id}`,
      time: new Date(),
      text: `${model.name}.${fieldName}.text.${id}`,
    });
  }
}

export class FHIR_ANNOTATION extends COMPOSITE {
  static ValueClass = FhirAnnotation;
}
