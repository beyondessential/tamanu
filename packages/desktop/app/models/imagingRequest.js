import Backbone from 'backbone-associations';
import moment from 'moment';
import * as Yup from 'yup';
import BaseModel from './base';
import { IMAGING_REQUEST_STATUSES } from '../constants';
import PatientModel from './patient';
import { register } from './register';

export default register(
  'ImagingRequest',
  BaseModel.extend({
    urlRoot: `${BaseModel.prototype.urlRoot}/imagingRequest`,
    defaults: () => ({
      date: moment(),
      type: null,
      detail: null,
      location: null,
      diagnosis: null,
      notes: null,
      imageSource: null,
      status: IMAGING_REQUEST_STATUSES.PENDING,
      requestedBy: null,
      requestedDate: moment(),
      reviewedBy: null,
      reviewedDate: moment(),
      ...BaseModel.prototype.defaults,
    }),
    ignoreRequestKeys: ['visits'],

    // Associations
    relations: [
      {
        type: Backbone.One,
        key: 'type',
        relatedModel: 'ImagingType',
      },
      {
        type: Backbone.One,
        key: 'diagnosis',
        relatedModel: 'Diagnosis',
      },
      {
        type: Backbone.One,
        key: 'requestedBy',
        relatedModel: 'User',
      },
      {
        type: Backbone.One,
        key: 'reviewedBy',
        relatedModel: 'User',
      },
      ...BaseModel.prototype.relations,
    ],

    reverseRelations: [
      {
        type: Backbone.One,
        key: 'visit',
        model: 'Visit',
      },
    ],

    getPatient() {
      const {
        parents: { visit: visitModel },
      } = this;
      const {
        parents: { patient: patientModel = new PatientModel() },
      } = visitModel;
      if (!patientModel.id) console.log(`patient not found for imagingRequest[${this.id}]`);
      return patientModel.toJSON();
    },

    validationSchema() {
      const rules = {
        type: Yup.mixed().required('is required'),
        visit: Yup.mixed().required('is required'),
      };
      if (this.get('_id')) {
        rules.diagnosis = Yup.mixed().required('is required');
        rules.detail = Yup.mixed().required('is required');
      }
      return Yup.object().shape(rules);
    },
  }),
);
