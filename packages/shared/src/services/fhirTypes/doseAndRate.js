import * as yup from 'yup';

import { FhirBaseType } from './baseType';
import { FhirCodeableConcept } from './codeableConcept';
import { FhirQuantity } from './quantity';

export const DOSE_AND_RATE_TYPES = {
  CALCULATED: { code: 'calculated', display: 'Calculated' },
  ORDERED: { code: 'ordered', display: 'Ordered' },
};
export const DOSE_AND_RATE_TYPES_SYSTEM = 'https://hl7.org/fhir/R4B/codesystem-dose-rate-type.html';

export class FhirDoseAndRate extends FhirBaseType {
  static SCHEMA() {
    return yup
      .object({
        type: FhirCodeableConcept.asYup().nullable().default(null),
        dose: yup
          .object({
            doseQuantity: FhirQuantity.asYup().nullable().default(null),
          })
          .nullable()
          .default(null),
      })
      .noUnknown();
  }

  constructor(data) {
    super({
      ...data,
      type: new FhirCodeableConcept({
        coding: [
          {
            system: DOSE_AND_RATE_TYPES_SYSTEM,
            code: DOSE_AND_RATE_TYPES.ORDERED.code,
            display: DOSE_AND_RATE_TYPES.ORDERED.display,
          },
        ],
      }),
    });
  }

  static fake() {
    return new this({
      type: FhirCodeableConcept.fake(),
      dose: {
        doseQuantity: FhirQuantity.fake(),
      },
    });
  }
}
