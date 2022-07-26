import { STRING } from 'sequelize';
import { toDateTimeString } from '../utils/dateTime';

// Used for storing date time strings in database
export function dateTimeType(fieldName) {
  return {
    type: STRING(19),
    set(value) {
      this.setDataValue(fieldName, toDateTimeString(value));
    },
  };
}
