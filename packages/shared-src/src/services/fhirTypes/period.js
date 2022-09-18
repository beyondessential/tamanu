import * as yup from 'yup';

import { toDateTimeString } from '../../utils/dateTime';
import { COMPOSITE, Composite } from '../../utils/pgComposite';

export class FhirPeriod extends Composite {
  static FIELD_ORDER = ['start', 'end'];
  static SCHEMA = yup
    .object({
      start: yup
        .date()
        .nullable()
        .default(null),
      end: yup
        .date()
        .when('start', (start, schema) =>
          start
            ? schema.test(
                'is-later-than-start',
                'end must be later than start',
                end => end === null || end > start,
              )
            : schema,
        )
        .nullable()
        .default(null),
    })
    .noUnknown();

  sqlFields(options) {
    return super.sqlFields(options).map(toDateTimeString);
  }

  static fake() {
    const end = random(0, Date.now());
    const start = end - random(0, end);

    return new this({
      start: new Date(start),
      end: new Date(end),
    });
  }
}

export class FHIR_PERIOD extends COMPOSITE {
  static ValueClass = FhirPeriod;
}
