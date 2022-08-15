/**
 * Create custom datetime char types linking Sequelize type to Postgres
 */
import util from 'util';
import { DataTypes, Utils } from 'sequelize';

const ABSTRACT = DataTypes.ABSTRACT.prototype.constructor;

export function createDateType() {
  class DATETIMESTRING extends ABSTRACT {
    static key = 'date_time_string';

    toSql() {
      // postgresql domain name
      return 'date_time_string';
    }

    validate(value) {
      return typeof value === 'string' && value.length === 19;
    }
  }

  class DATESTRING extends ABSTRACT {
    toSql() {
      // postgresql domain name
      return 'date_string';
    }

    validate(value) {
      return typeof value === 'string' && value.length === 10;
    }
  }

  // set the type key
  DATETIMESTRING.prototype.key = 'date_time_string';
  DATESTRING.prototype.key = 'date_string';

  // be able to use this datatype directly without having to call `new` on it.
  DataTypes.DATETIMESTRING = Utils.classToInvokable(DATETIMESTRING);
  DataTypes.DATESTRING = Utils.classToInvokable(DATESTRING);
  DataTypes.DATETIMESTRING.types.postgres = ['date_time_string'];
  DataTypes.DATESTRING.types.postgres = ['date_string'];

  const PgTypes = DataTypes.postgres;

  PgTypes.DATETIMESTRING = function dateTimeString(...args) {
    if (!(this instanceof PgTypes.DATETIMESTRING)) return new PgTypes.DATETIMESTRING();
    return DataTypes.DATETIMESTRING.apply(this, args);
  };

  util.inherits(PgTypes.DATETIMESTRING, DataTypes.DATETIMESTRING);
  PgTypes.DATETIMESTRING.parse = DataTypes.DATETIMESTRING.parse;
  PgTypes.DATETIMESTRING.types = { postgres: ['date_time_string'] };
  DataTypes.postgres.DATETIMESTRING.key = 'date_time_string';

  PgTypes.DATESTRING = function dateString(...args) {
    if (!(this instanceof PgTypes.DATESTRING)) return new PgTypes.DATESTRING();
    return DataTypes.DATESTRING.apply(this, args);
  };

  util.inherits(PgTypes.DATESTRING, DataTypes.DATESTRING);
  PgTypes.DATESTRING.parse = DataTypes.DATESTRING.parse;
  PgTypes.DATESTRING.types = { postgres: ['date_string'] };
  DataTypes.postgres.DATESTRING.key = 'date_string';
}
