import * as yup from 'yup';
import array from 'postgres-array';
import { Chance } from 'chance';
import { random } from 'lodash';

import { COMPOSITE, Composite } from '../../utils/pgComposite';
import { FhirCodeableConcept } from './codeableConcept';
import { FhirReference } from './reference';

export class FhirImmunizationProtocolApplied extends Composite {
  static FIELD_ORDER = [
    'series',
    'authority',
    'targetDisease',
    'doseNumberPositiveInt',
    'doseNumberString',
    'seriesDosesPositiveInt',
    'seriesDosesString',
  ];

  static SCHEMA() {
    return yup
      .object({
        series: yup
          .string()
          .nullable()
          .default(null),
        authority: FhirReference.asYup().nullable(),
        targetDisease: yup
          .array()
          .of(FhirCodeableConcept.asYup())
          .nullable()
          .default([]),
        doseNumberPositiveInt: yup
          .number()
          .positive()
          .integer()
          .min(1)
          .nullable()
          .default(null),
        doseNumberString: yup
          .string()
          .nullable()
          .default(null),
        seriesDosesPositiveInt: yup
          .number()
          .positive()
          .integer()
          .min(1)
          .nullable()
          .default(null),
        seriesDosesString: yup
          .string()
          .nullable()
          .default(null),
      })
      .test(
        'doseNumber[x]',
        'doseNumberPositiveInt or doseNumberString is required',
        ({ doseNumberPositiveInt, doseNumberString }) => {
          return doseNumberPositiveInt !== null || doseNumberString !== null;
        },
      )
      .noUnknown();
  }

  static validateAndTransformFromSql({ authority, targetDisease, ...fields }) {
    return new this({
      authority: authority && FhirReference.fromSql(authority),
      targetDisease:
        targetDisease && array.parse(targetDisease, el => FhirCodeableConcept.fromSql(el)),
      ...fields,
    });
  }

  static fake(...args) {
    const chance = new Chance();
    const targetDisease = Array(random(0, 3))
      .fill(0)
      .map(() => FhirCodeableConcept.fake(...args));

    return new this({
      series: chance.string(),
      authority: FhirReference.fake(...args),
      targetDisease,
      doseNumberString: chance.pickone(['one', 'two', 'three', 'four']),
      seriesDosesString: chance.string(),
    });
  }
}

export class FHIR_IMMUNIZATION_PROTOCOL_APPLIED extends COMPOSITE {
  static ValueClass = FhirImmunizationProtocolApplied;
}
