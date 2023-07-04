import { random } from 'lodash';
import * as yup from 'yup';

import { formatFhirDate } from '../../utils/fhir';
import { FhirBaseType } from './baseType';

export class FhirPeriod extends FhirBaseType {
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

  static fake() {
    const end = random(0, Date.now());
    const start = end - random(0, end);

    return new this({
      start: formatFhirDate(new Date(start)),
      end: formatFhirDate(new Date(end)),
    });
  }
}
