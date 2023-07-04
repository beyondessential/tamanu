import { Chance } from 'chance';
import { sample } from 'lodash';
import * as yup from 'yup';

import { FhirBaseType } from './baseType';
import { FhirPeriod } from './period';

const USES = ['home', 'work', 'temp', 'old', 'billing'];
const TYPES = ['postal', 'physical', 'both'];

export class FhirAddress extends FhirBaseType {
  static SCHEMA() {
    return yup
      .object({
        use: yup
          .string()
          .oneOf([null, ...USES])
          .nullable()
          .default(null),
        type: yup
          .string()
          .oneOf([null, ...TYPES])
          .nullable()
          .default(null),
        text: yup
          .string()
          .nullable()
          .default(null),
        line: yup
          .array()
          .of(yup.string())
          .nullable()
          .default([]),
        city: yup
          .string()
          .nullable()
          .default(null),
        district: yup
          .string()
          .nullable()
          .default(null),
        state: yup
          .string()
          .nullable()
          .default(null),
        postalCode: yup
          .string()
          .nullable()
          .default(null),
        country: yup
          .string()
          .nullable()
          .default(null),
        period: FhirPeriod.asYup()
          .nullable()
          .default(null),
      })
      .noUnknown();
  }

  // FIXME: Check this mention of the spec via Yup:
  // > The text element specifies the entire address as it should be displayed e.g. on a postal
  // > label. This may be provided instead of or as well as the specific parts. Applications
  // > updating an address SHALL ensure that when both text and parts are present, no content is
  // > included in the text that isn't found in a part.
  // -- https://www.hl7.org/fhir/datatypes.html#Address

  static fake() {
    const chance = new Chance();
    return new this({
      use: sample(USES),
      type: sample(TYPES),
      text: chance.address(),
    });
  }
}
