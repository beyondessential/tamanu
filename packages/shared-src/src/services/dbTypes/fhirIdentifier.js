import { ValidationError } from 'sequelize';
import yup from 'yup';

import { COMPOSITE, stringify } from './common';

const IDENTIFIER_SCHEMA = yup
  .object({
    use: yup.string().optional(),
    system: yup.string().optional(),
    value: yup.string().optional(),
    period: PERIOD_SCHEMA,
    assigner: yup.string().optional(),
  })
  .noUnknown();

export class IDENTIFIER extends COMPOSITE {
  constructor(use, system, value, period, assigner) {
    super();
    const options = _.isPlainObject(type) ? type : { use, system, value, period, assigner };
    this.options = options;
    this.use = options.use;
    this.system = options.system;
    this.value = options.value;
    this.period = options.period;
    this.assigner = options.assigner;
  }

  toSql() {
    return 'fhir.identifier';
  }

  _stringify() {
    return stringify([this.use, this.system, this.value, this.period._stringify(), this.assigner]);
  }

  validate(value) {
    try {
      IDENTIFIER_SCHEMA.validateSync(value);
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
