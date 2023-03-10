import { random } from 'lodash';
import * as yup from 'yup';

import { toDateTimeString } from '../../utils/dateTime';
import { formatFhirDate } from '../../utils/fhir';
import { COMPOSITE, Composite } from '../../utils/pgComposite';

export class FhirPeriod extends Composite {
  static FIELD_ORDER = ['start', 'end'];

  static SCHEMA() {
    return yup
      .object({
        start: yup
          .string()
          .nullable()
          .default(null),
        end: yup
          .string()
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
  }

  sqlFields(options) {
    return super.sqlFields(options).map(toDateTimeString);
  }

  asFhir() {
    return {
      start: formatFhirDate(this.start),
      end: formatFhirDate(this.end),
    };
  }

  static fake() {
    const end = random(0, Date.now());
    const start = end - random(0, end);

    return new this({
      start: formatFhirDate(new Date(start)),
      end: formatFhirDate(new Date(end)),
    });
  }
}

export class FHIR_PERIOD extends COMPOSITE {
  static ValueClass = FhirPeriod;
}
