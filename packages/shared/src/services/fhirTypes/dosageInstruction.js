import * as yup from 'yup';

import { FhirBaseType } from './baseType';
import { FhirTiming } from './timing';
import { FhirDoseAndRate } from './doseAndRate';
import { FhirCodeableConcept } from './codeableConcept';

export class FhirDosageInstruction extends FhirBaseType {
  static SCHEMA() {
    return yup
      .object({
        text: yup.string().nullable().default(null),
        timing: FhirTiming.asYup().nullable().default(null),
        doseAndRate: yup.array().of(FhirDoseAndRate.asYup()).nullable().default(null),
        route: FhirCodeableConcept.asYup().nullable().default(null),
      })
      .noUnknown();
  }

  static fake() {
    return new this({
      text: 'Take 1 tablet by mouth',
      timing: FhirTiming.fake(),
      doseAndRate: [FhirDoseAndRate.fake()],
    });
  }
}
