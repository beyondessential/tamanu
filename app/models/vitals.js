import shortid from 'shortid';
import { defaults } from 'lodash';
import moment from 'moment';
import BaseModel from './base';

export default BaseModel.extend({
  urlRoot:  `${process.env.LAN_REALM}/vitals`,
  defaults: () => defaults({
    _id: shortid.generate(),
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
  }
});
