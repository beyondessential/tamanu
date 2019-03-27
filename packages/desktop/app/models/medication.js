import Backbone from 'backbone-associations';
import { isNaN, toNumber, defaults } from 'lodash';
import moment from 'moment';
import BaseModel from './base';
import { medicationStatuses } from '../constants';
import PatientModel from './patient';
import { register } from './register';

export default register('Medication', BaseModel.extend({
  urlRoot: `${BaseModel.prototype.urlRoot}/medication`,
  defaults: () => defaults({
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
    dispense: false,
    status: medicationStatuses.REQUESTED,
    history: [],
  }, BaseModel.prototype.defaults),

  // Associations
  relations: [
    {
      type: Backbone.One,
      key: 'drug',
      relatedModel: () => require('./drug'),
    },
    {
      type: Backbone.Many,
      key: 'history',
      relatedModel: () => require('./medicationHistory'),
    },
    ...BaseModel.prototype.relations,
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
  },

  async getPatient() {
    const patient = new PatientModel({ _id: this.attributes.patient });
    await patient.fetch();
    return patient;
  },
}));
