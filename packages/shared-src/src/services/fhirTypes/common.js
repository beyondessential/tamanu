import { DataTypes, Utils } from 'sequelize';
import util from 'util';

const PgTypes = DataTypes.postgres;
export function newPgDataType(name, klass, pg_name = (new klass).toSql()) {
  klass.key = pg_name;
  klass.prototype.key = pg_name;

  DataTypes[name] = Utils.classToInvokable(klass);
  DataTypes[name].types.postgres = [pg_name];

  PgTypes[name] = function () {
    if (!(this instanceof PgTypes[name])) {
      return new PgTypes[name]();
    }

    DataTypes[name].apply(this, arguments);
  };

  util.inherits(PgTypes[name], DataTypes[name]);
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
