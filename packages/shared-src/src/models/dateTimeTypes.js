import { DataTypes } from 'sequelize';
import { toDateTimeString, toDateString } from '../utils/dateTime';

// Used for storing date time strings in database
export function dateTimeType(fieldName) {
  return {
    type: DataTypes.DATETIMESTRING,
    set(value) {
      this.setDataValue(fieldName, toDateTimeString(value));
    },
  };
}

// Used for storing date only strings in database
export function dateType(fieldName) {
  return {
    type: DataTypes.DATESTRING,
    set(value) {
      this.setDataValue(fieldName, toDateString(value));
    },
  };
}
