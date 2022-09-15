import { ValidationError } from 'sequelize';
import * as yup from 'yup';
import { isPlainObject } from 'lodash';

import { toDateTimeString } from 'shared/utils/dateTime';
import { COMPOSITE, stringify } from './common';

export const PERIOD_SCHEMA = yup
  .object({
    start: yup.string().optional(),
    end: yup.string().optional(),
  })
  .noUnknown();

export class PERIOD extends COMPOSITE {
  constructor(start, end) {
    super();
    const options = isPlainObject(start) ? start : { start, end };
    this.options = options;
    this.start = options.start;
    this.end = options.end;
  }

  toSql() {
    return 'fhir.period';
  }

  _stringify() {
    return stringify(toDateTimeString(this.start), toDateTimeString(this.end));
  }

  validate(value) {
    try {
      PERIOD_SCHEMA.validateSync(value);
      return true;
    } catch (err) {
      throw new ValidationError(err.toString());
    }
  }

  static parse(value) {
    console.log(value);
    return value;
  }
}
