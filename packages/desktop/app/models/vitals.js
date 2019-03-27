import { defaults } from 'lodash';
import moment from 'moment';
import BaseModel from './base';
import { register } from './register';

export default register('Vitals', BaseModel.extend({
  urlRoot: `${BaseModel.prototype.urlRoot}/vitals`,
  defaults: () => defaults({
    dateRecorded: moment(),
    temperature: null,
    bloodSugarLevel: null,
    weight: null,
    height: null,
    sbp: null,
    dbp: null,
    heartRate: null,
    respiratoryRate: null,
  }, BaseModel.prototype.defaults),

  validate: (attrs) => {
    if (!attrs.dateRecorded
        && !attrs.temperature
        && !attrs.sbp
        && !attrs.dbp
        && !attrs.heartRate
        && !attrs.respiratoryRate) return ['At least one field is required'];
  },
}));
