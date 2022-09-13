import { DataTypes, Utils, ValidationError } from 'sequelize';
import util from 'util';
import yup from 'yup';

import { toDateTimeString } from '../utils/dateTime';

const PgTypes = DataTypes.postgres;

function newPgDataType(pg_name, DEFN) {
  DEFN.key = pg_name;
  DEFN.prototype.key = pg_name;

  DataTypes[DEFN] = Utils.classToInvokable(DEFN);
  DataTypes[DEFN].types.postgres = [pg_name];

  PgTypes[DEFN] = function() {
    if (!(this instanceof PgTypes[DEFN])) {
      return new PgTypes[DEFN]();
    }

    DataTypes[DEFN].apply(this, arguments);
  };

  util.inherits(PgTypes[DEFN], DataTypes[DEFN]);
}

const PERIOD_SCHEMA = yup
  .object({
    start: yup.string().optional(),
    end: yup.string().optional(),
  })
  .noUnknown();

const IDENTIFIER_SCHEMA = yup
  .object({
    use: yup.string().optional(),
    system: yup.string().optional(),
    value: yup.string().optional(),
    period: PERIOD_SCHEMA,
    assigner: yup.string().optional(),
  })
  .noUnknown();

class COMPOSITE extends DataTypes.ABSTRACT {
  _bindParam(value, options) {
    return `(${options.bindParam(value)})`;
  }
}

class PERIOD extends COMPOSITE {
  constructor(start, end) {
    super();
    const options = _.isPlainObject(type) ? type : { start, end };
    this.options = options;
    this.start = options.start;
    this.end = options.end;
  }

  toSql() {
    return 'fhir.period';
  }

  _stringify() {
    return `('${toDateTimeString(this.start)}', '${toDateTimeString(this.end)}')`;
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

export function createFhirTypes() {
  newPgDataType('fhir.period', PERIOD);
}
