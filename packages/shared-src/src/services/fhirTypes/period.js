import { random } from 'lodash';
import * as yup from 'yup';
import { FHIR_DATETIME_PRECISION } from '../../constants';

import { toDateTimeString } from '../../utils/dateTime';
import { formatDateTime } from '../../utils/fhir';
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
      start: formatDateTime(this.start, FHIR_DATETIME_PRECISION.SECONDS_WITH_TIMEZONE),
      end: formatDateTime(this.end, FHIR_DATETIME_PRECISION.SECONDS_WITH_TIMEZONE),
    };
  }

  static fake() {
    const end = random(0, Date.now());
    const start = end - random(0, end);

    return new this({
      start: formatDateTime(new Date(start), FHIR_DATETIME_PRECISION.SECONDS_WITH_TIMEZONE),
      end: formatDateTime(new Date(end), FHIR_DATETIME_PRECISION.SECONDS_WITH_TIMEZONE),
    });
  }
}

export class FHIR_PERIOD extends COMPOSITE {
  static ValueClass = FhirPeriod;
}
