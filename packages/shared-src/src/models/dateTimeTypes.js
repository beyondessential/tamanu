import { CHAR } from 'sequelize';
import { ISO9075_DATETIME_FORMAT_LENGTH, ISO9075_DATE_FORMAT_LENGTH } from '../constants';
import { toDateTimeString, toDateString } from '../utils/dateTime';

// Used for storing date time strings in database
export function dateTimeType(fieldName) {
  return {
    type: CHAR(ISO9075_DATETIME_FORMAT_LENGTH),
    set(value) {
      this.setDataValue(fieldName, toDateTimeString(value));
    },
    validate: {
      len: [ISO9075_DATETIME_FORMAT_LENGTH],
    },
  };
}

// Used for storing date only strings in database
export function dateType(fieldName) {
  return {
    type: CHAR(ISO9075_DATE_FORMAT_LENGTH),
    set(value) {
      this.setDataValue(fieldName, toDateString(value));
    },
    validate: {
      len: [ISO9075_DATE_FORMAT_LENGTH],
    },
  };
}
