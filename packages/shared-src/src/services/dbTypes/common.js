import { DataTypes, Utils } from 'sequelize';
import util from 'util';

const PgTypes = DataTypes.postgres;
export function newPgDataType(DEFN, pg_name = DEFN.toSql()) {
  DEFN.key = pg_name;
  DEFN.prototype.key = pg_name;

  DataTypes[DEFN] = Utils.classToInvokable(DEFN);
  DataTypes[DEFN].types.postgres = [pg_name];

  PgTypes[DEFN] = function () {
    if (!(this instanceof PgTypes[DEFN])) {
      return new PgTypes[DEFN]();
    }

    DataTypes[DEFN].apply(this, arguments);
  };

  util.inherits(PgTypes[DEFN], DataTypes[DEFN]);
}

export class COMPOSITE extends DataTypes.ABSTRACT {
  _bindParam(value, options) {
    return `(${options.bindParam(value)})`;
  }
}

export function stringify(args) {
  const iter = (typeof args === 'object')
    ? Object.values(iter)
    : iter;

  return `(${iter.map(v => `'${v}'`).join(', ')})`;
}
