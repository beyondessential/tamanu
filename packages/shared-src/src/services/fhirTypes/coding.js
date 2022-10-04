import { random, sample } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import * as yup from 'yup';

import { COMPOSITE, Composite } from '../../utils/pgComposite';

export class FhirCoding extends Composite {
  static FIELD_ORDER = ['system', 'version', 'code', 'display', 'userSelected'];

  static SCHEMA = yup
    .object({
      system: yup
        .string()
        .url()
        .nullable()
        .default(null),
      version: yup
        .string()
        .nullable()
        .default(null),
      code: yup
        .string()
        .nullable()
        .default(null),
      display: yup
        .string()
        .nullable()
        .default(null),
      userSelected: yup
        .boolean()
        .transform(function quantityParse(value, originalValue) {
          if (this.isType(value)) return value;

          if (originalValue.startsWith('t')) return true;
          if (originalValue.startsWith('f')) return false;

          return null;
        })
        .nullable()
        .default(null),
    })
    .noUnknown();

  static fake(model, { fieldName }, id) {
    return new this({
      system: `https://tamanu.io/${model.name}/${uuidv4()}`,
      version: `${random(1, 9)}.0`,
      code: `${fieldName}.${id}`,
      display: fieldName.toUpperCase(),
      userSelected: sample([null, true, false]),
    });
  }
}

export class FHIR_CODING extends COMPOSITE {
  static ValueClass = FhirCoding;
}
