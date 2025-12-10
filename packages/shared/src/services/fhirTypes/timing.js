import { random } from 'lodash';
import * as yup from 'yup';

import { FhirBaseType } from './baseType';

const PERIOD_UNITS = ['s', 'min', 'h', 'd', 'wk', 'mo', 'a']; // https://hl7.org/fhir/R4B/valueset-units-of-time.html

const TIME_OF_DAY_REGEX = /^([01][0-9]|2[0-3]):[0-5][0-9]:([0-5][0-9]|60)(\.[0-9]+)?$/; // https://hl7.org/fhir/R4B/datatypes.html#time

export class FhirTiming extends FhirBaseType {
  static SCHEMA() {
    return yup
      .object({
        repeat: yup
          .object({
            frequency: yup.number().nullable().default(null),
            period: yup.number().nullable().default(null),
            periodUnit: yup
              .string()
              .oneOf([undefined, null, ...PERIOD_UNITS])
              .nullable()
              .default(null),
            timeOfDay: yup
              .array()
              .of(yup.string())
              .test('is-valid-time-of-day', 'Invalid time of day', value => {
                if (!value) return true;
                return value.every(time => TIME_OF_DAY_REGEX.test(time));
              })
              .nullable()
              .default(null),
          })
          .nullable()
          .default(null),
      })
      .noUnknown();
  }

  static fake() {
    return new this({
      repeat: {
        frequency: random(1, 10),
        period: random(1, 10),
        periodUnit: PERIOD_UNITS[random(0, PERIOD_UNITS.length - 1)],
        timeOfDay: null,
      },
    });
  }
}
