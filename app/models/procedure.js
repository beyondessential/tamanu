import Backbone from 'backbone-associations';
import { defaults, isEmpty } from 'lodash';
import moment from 'moment';
import BaseModel from './base';

export default BaseModel.extend({
  urlRoot:  `${process.env.LAN_REALM}/procedure`,
  defaults: () => defaults({
    anesthesiaType: '',
    anesthesiologist: '',
    assistant: '',
    description: '',
    cptCode: '',
    location: '',
    notes: '',
    physician: '',
    procedureDate: moment(),
    timeStarted: '',
    timeEnded: '',

    medication: [],
  }, BaseModel.prototype.defaults),

  // Associations
  relations: [
    {
      type: Backbone.Many,
      key: 'medication',
      relatedModel: () => require('./procedureMedication'),
      // map: (values) => mapRelations(values, require('./procedureMedication')),
      // serialize: '_id'
    },
  ],

  validate: (attrs) => {
    const errors = [];
    if (!attrs.description) errors.push('description is required!');
    if (!attrs.procedureDate) errors.push('procedureDate is required!');
    if (!attrs.physician) errors.push('physician is required!');
    if (!isEmpty(errors)) return errors;
  }
});
