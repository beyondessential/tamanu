/**
 * Create custom datetime Sequelize types and link to Postgres types.
 */
import util from 'util';
import { DataTypes, Utils, ABSTRACT } from 'sequelize';

export function createDateType() {
  class DATETIMESTRING extends ABSTRACT {
    toSql() {
      return 'date_time_string';
    }

    validate(value) {
      return typeof value === 'string' && value.length === 19;
    }
  }

  class DATESTRING extends ABSTRACT {
    toSql() {
      return 'date_string';
    }

    validate(value) {
      return typeof value === 'string' && value.length === 10;
    }
  }

  // Set the type key
  DATETIMESTRING.prototype.key = 'date_time_string';
  DATESTRING.prototype.key = 'date_string';

  // Make datatype able to be used directly without having to call `new` on it.
  DataTypes.DATETIMESTRING = Utils.classToInvokable(DATETIMESTRING);
  DataTypes.DATESTRING = Utils.classToInvokable(DATESTRING);

  // Map the datatype to the postgres type/domain name
  DataTypes.DATETIMESTRING.types.postgres = ['date_time_string'];
  DataTypes.DATESTRING.types.postgres = ['date_string'];

  const PgTypes = DataTypes.postgres;

  PgTypes.DATETIMESTRING = function dateTimeString(...args) {
    if (!(this instanceof PgTypes.DATETIMESTRING)) return new PgTypes.DATETIMESTRING();
    return DataTypes.DATETIMESTRING.apply(this, args);
  };

  util.inherits(PgTypes.DATETIMESTRING, DataTypes.DATETIMESTRING);
  // Reassign postgres-specific parser
  PgTypes.DATETIMESTRING.parse = DataTypes.DATETIMESTRING.parse;

  // These two extra steps are seemingly necessary altho not described in sequelize docs
  PgTypes.DATETIMESTRING.types = { postgres: ['date_time_string'] };
  DataTypes.postgres.DATETIMESTRING.key = 'date_time_string';

  PgTypes.DATESTRING = function dateString(...args) {
    if (!(this instanceof PgTypes.DATESTRING)) return new PgTypes.DATESTRING();
    return DataTypes.DATESTRING.apply(this, args);
  };

  util.inherits(PgTypes.DATESTRING, DataTypes.DATESTRING);
  // Reassign postgres-specific parser
  PgTypes.DATESTRING.parse = DataTypes.DATESTRING.parse;
  // These two extra steps are seemingly necessary altho not described in sequelize docs
  PgTypes.DATESTRING.types = { postgres: ['date_string'] };
  DataTypes.postgres.DATESTRING.key = 'date_string';
}
