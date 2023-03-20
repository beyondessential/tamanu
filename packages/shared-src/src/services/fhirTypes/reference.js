import * as yup from 'yup';

import { COMPOSITE, Composite } from '../../utils/pgComposite';
// eslint-disable-next-line import/no-cycle
import { FhirIdentifier } from './identifier';

export class FhirReference extends Composite {
  static FIELD_ORDER = ['reference', 'type', 'identifier', 'display'];

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

  static validateAndTransformFromSql({ identifier, ...fields }) {
    return new this({
      // stored in postgres as JSONB to avoid type cycle
      identifier: identifier && new FhirIdentifier(JSON.parse(identifier)),
      ...fields,
    });
  }

  static fake(model, { fieldName }, id) {
    return new this({
      type: model,
      display: `${fieldName}.${id}`,
    });
  }

  fhirTypeAndId() {
    const TYPE_ID_URL_REGEX = /\/(?<type>\w+)\/(?<id>[0-9a-f-]+)$/i;

    const { reference } = this.params;
    if (!reference) return null;

    const match = TYPE_ID_URL_REGEX.exec(reference);
    if (match) {
      return {
        type: match.groups.type,
        id: match.groups.id,
      };
    }

    return null;
  }
}

export class FHIR_REFERENCE extends COMPOSITE {
  static ValueClass = FhirReference;
}
