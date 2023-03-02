import * as yup from 'yup';
import { formatDateTime } from '../../utils/fhir';

import { COMPOSITE, Composite } from '../../utils/pgComposite';
import { FhirReference } from './reference';
import { FHIR_DATETIME_PRECISION } from '../../constants';

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
          .string()
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

  static validateAndTransformFromSql({ authorReference, ...fields }) {
    return new this({
      authorReference: authorReference && FhirReference.fromSql(authorReference),
      ...fields,
    });
  }

  static fake(model, { fieldName }, id) {
    return new this({
      authorString: `${model.name}.${fieldName}.author.${id}`,
      time: formatDateTime(new Date(), FHIR_DATETIME_PRECISION.SECONDS_WITH_TIMEZONE),
      text: `${model.name}.${fieldName}.text.${id}`,
    });
  }
}

export class FHIR_ANNOTATION extends COMPOSITE {
  static ValueClass = FhirAnnotation;
}
