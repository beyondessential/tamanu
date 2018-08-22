import Backbone from 'backbone-associations';
import shortid from 'shortid';
import { isNaN, toNumber } from 'lodash';
import moment from 'moment';
import BaseModel from './base';
import { mapRelations } from '../utils';

export default BaseModel.extend({
  idAttribute: '_id',
  defaults: () => {
    const _id = shortid.generate();

    return {
      _id: `medication_${_id}`,
      docType: 'medication',
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
      requestedDate: '',
      requestedBy: '',
      status: '',
    };
  },

  // Associations
  relations: [
    {
      type: Backbone.One,
      key: 'patient',
      relatedModel: () => require('./patient'),
      map: (values) => mapRelations(values, require('./patient')),
      serialize: '_id'
    },
    {
      type: Backbone.One,
      key: 'visit',
      relatedModel: () => require('./visit'),
      map: (values) => mapRelations(values, require('./visit')),
      serialize: '_id'
    },
    {
      type: Backbone.One,
      key: 'drug',
      relatedModel: () => require('./drug'),
      map: (values) => mapRelations(values, require('./drug')),
      serialize: '_id'
    },
  ],

  validate: (attrs) => {
    if (attrs.drugName === '') return 'Medication is required!';
    if (attrs.prescription === '') return 'Prescription is required!';
    if (attrs.prescriptionDate === '') return 'Prescription Date is required!';
    if (isNaN(toNumber(attrs.qtyMorning))) return 'Morning quantity is required!';
    if (isNaN(toNumber(attrs.qtyLunch))) return 'Lunch quantity is required!';
    if (isNaN(toNumber(attrs.qtyEvening))) return 'Evening quantity is required!';
    if (isNaN(toNumber(attrs.qtyNight))) return 'Night quantity is required!';
  }
});
