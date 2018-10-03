import Backbone from 'backbone-associations';
import shortid from 'shortid';
import { defaults } from 'lodash';
import moment from 'moment';
import BaseModel from './base';
import mapRelations from '../utils/map-relations';

export default BaseModel.extend({
  url: `${BaseModel.prototype.url}/vital`,
  defaults: () => defaults({
    dateRecorded: moment(),
    temperature: null,
    weight: null,
    height: null,
    sbp: null,
    dbp: null,
    heartRate: null,
    respiratoryRate: null,
  }, BaseModel.prototype.defaults),

  validate: (attrs) => {
    const errors = [];
    if (!attrs.dateRecorded) errors.push('dateRecorded is required!');
    if (!attrs.temperature) errors.push('temperature is required!');
    if (!attrs.sbp) errors.push('sbp is required!');
    if (!attrs.dbp) errors.push('dbp is required!');
    if (!attrs.heartRate) errors.push('heartRate is required!');
    if (!attrs.respiratoryRate) errors.push('respiratoryRate is required!');
    if (errors.length) return errors;
  }
});
