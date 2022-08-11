import { STRING } from 'sequelize';
import { ISO9075_FORMAT_LENGTH } from '../constants';
import { toDateTimeString } from '../utils/dateTime';

// Used for storing date time strings in database
export function dateTimeType(fieldName) {
  return {
    type: STRING(ISO9075_FORMAT_LENGTH),
    set(value) {
      this.setDataValue(fieldName, toDateTimeString(value));
    },
    validate: {
      len: [ISO9075_FORMAT_LENGTH],
    },
  };
}
