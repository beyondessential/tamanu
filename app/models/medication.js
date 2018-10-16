import Backbone from 'backbone-associations';
import shortid from 'shortid';
import { isNaN, toNumber, defaults } from 'lodash';
import moment from 'moment';
import BaseModel from './base';
import { mapRelations } from '../utils';
import { medicationStatuses } from '../constants';

export default BaseModel.extend({
  urlRoot:  `${process.env.LAN_REALM}/medication`,
  defaults: () => defaults({
      _id: shortid.generate(),
    patient: '',
    visit: '',
    drug: '',
    notes: '',
    prescription: '',
    prescriptionDate: moment(),
    qtyMorning: 0,
    qtyLunch: 0,
    qtyEvening: 0,
    qtyNight: 0,
    refills: '',
    endDate: null,
    requestedDate: moment(),
    requestedBy: '',
    status: medicationStatuses.REQUESTED,
    history: [],
  }, BaseModel.prototype.defaults),

  // Associations
  relations: [
    {
      type: Backbone.One,
      key: 'patient',
      relatedModel: () => require('./patient'),
      // map: (values) => mapRelations(values, require('./patient')),
      // serialize: '_id'
    },
    {
      type: Backbone.One,
      key: 'visit',
      relatedModel: () => require('./visit'),
      // map: (values) => mapRelations(values, require('./visit')),
      // serialize: '_id'
    },
    {
      type: Backbone.One,
      key: 'drug',
      relatedModel: () => require('./drug'),
      // map: (values) => mapRelations(values, require('./drug')),
      // serialize: '_id'
    },
    {
      type: Backbone.Many,
      key: 'history',
      relatedModel: () => require('./medicationHistory'),
      // map: (values) => mapRelations(values, require('./medicationHistory')),
      // serialize: '_id'
    },
  ],

  validate: (attrs) => {
    const errors = [];
    if (attrs.drugName === '') errors.push('Medication is required!');
    if (attrs.prescription === '') errors.push('Prescription is required!');
    if (attrs.prescriptionDate === '') errors.push('Prescription Date is required!');
    if (isNaN(toNumber(attrs.qtyMorning))) errors.push('Morning quantity is required!');
    if (isNaN(toNumber(attrs.qtyLunch))) errors.push('Lunch quantity is required!');
    if (isNaN(toNumber(attrs.qtyEvening))) errors.push('Evening quantity is required!');
    if (isNaN(toNumber(attrs.qtyNight))) errors.push('Night quantity is required!');
    if (errors.length) return errors;
  }
});
