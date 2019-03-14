import Backbone from 'backbone-associations';
import { defaults, each, clone, get, filter, capitalize, concat } from 'lodash';
import moment from 'moment';
import BaseModel from './base';
import { concatSelf } from '../utils';
import { pregnancyOutcomes, dateFormat, LAB_REQUEST_STATUSES } from '../constants';
import LabRequestsCollection from '../collections/labRequests';

export default BaseModel.extend({
  urlRoot: `${BaseModel.prototype.urlRoot}/patient`,
  defaults: () => defaults({
    displayId: '',
    admitted: false,
    address: '',
    address2: '',
    address3: '',
    address4: '',
    bloodType: '',
    clinic: '',
    country: '',
    checkedIn: false,
    dateOfBirth: null,
    economicClassification: '',
    email: '',
    externalPatientId: '',
    familySupport1: '',
    familySupport2: '',
    familySupport3: '',
    familySupport4: '',
    familySupport5: '',
    // familyInfo: [],
    firstName: '',
    sex: '',
    occupation: '',
    history: '', // No longer used
    insurance: '',
    lastName: '',
    livingArrangement: '',
    middleName: '',
    culturalName: '',
    notes: '',
    otherIncome: '',
    patientType: '',
    parent: '',
    phone: '',
    placeOfBirth: '',
    referredDate: null,
    referredBy: '',
    religion: '',
    socialActionTaken: '',
    socialRecommendation: '',
    status: '',

    appointments: [],
    additionalContacts: [],
    allergies: [],
    conditions: [],
    operationReports: [],
    operativePlans: [],
    pregnancies: [],
    surveyResponses: [],
    visits: [],
  }, BaseModel.prototype.defaults),

  // Associations
  relations: [
    {
      type: Backbone.Many,
      key: 'appointments',
      relatedModel: () => require('./appointment'),
      serialize: '_id'
    },
    {
      type: Backbone.Many,
      key: 'additionalContacts',
      relatedModel: () => require('./patientContact'),
      serialize: '_id'
    }, {
      type: Backbone.Many,
      key: 'allergies',
      relatedModel: () => require('./allergy'),
      serialize: '_id'
    }, {
      type: Backbone.Many,
      key: 'conditions',
      relatedModel: () => require('./condition'),
      serialize: '_id'
    }, {
      type: Backbone.Many,
      key: 'operationReports',
      relatedModel: () => require('./operationReport'),
      serialize: '_id'
    }, {
      type: Backbone.Many,
      key: 'operativePlans',
      relatedModel: () => require('./operativePlan'),
      serialize: '_id'
    }, {
      type: Backbone.Many,
      key: 'pregnancies',
      relatedModel: () => require('./pregnancy'),
      serialize: '_id'
    }, {
      type: Backbone.Many,
      key: 'surveyResponses',
      relatedModel: () => require('./surveyResponse'),
      serialize: '_id'
    }, {
      type: Backbone.Many,
      key: 'visits',
      relatedModel: () => require('./visit'),
      collectionType: require('../collections/visits'),
      serialize: '_id'
    },
    ...BaseModel.prototype.relations
  ],

  validate(attrs) {
    if (attrs.firstName === '') return 'firstName is required!';
    if (attrs.lastName === '') return 'lastName is required!';
  },

  getDisplayName() {
    const { firstName, lastName } = this.attributes;
    return [firstName, lastName].join(' ');
  },

  getOpenPlan() {
    let _return = {};
    if (this.attributes.operativePlans.models.length > 0) {
      each(this.attributes.operativePlans.models, (opPlan) => {
        const operationPlan = clone(opPlan.attributes);
        if (operationPlan.status === 'planned') _return = opPlan.toJSON();
      });
    }

    return _return;
  },

  getProcedures() {
    const operationReports = this.get('operationReports');
    let allProcedures = [];
    operationReports.models.forEach((model) => {
      const { procedures, surgeryDate: date, _id: operationReportId } = model.toJSON();
      allProcedures = allProcedures.concat(procedures.map(name => { return { name, date, operationReportId }; }));
    });

    return allProcedures;
  },

  getPregnancies() {
    const pregnancies = this.get('pregnancies');
    return pregnancies.models.map((p, k) => {
      const _item = clone(p.attributes);
      _item.label = `Pregnancy ${k + 1}`;
      _item.conceiveDate = moment(_item.conceiveDate).format(dateFormat);
      if (_item.outcome === '' || _item.outcome === 'fetalDeath') {
        _item.deliveryDate = '';
        _item.child = '';
      }
      if (_item.deliveryDate !== '') _item.deliveryDate = moment(_item.deliveryDate).format(dateFormat);
      _item.outcomeLabel = get(filter(pregnancyOutcomes, outcome => outcome.value === _item.outcome)[0], 'label');
      return _item;
    });
  },

  getVisitsSelect() {
    let visits = this.get('visits').toJSON();
    visits = visits.map(visit => {
      const label = [];
      label.push(moment(visit.startDate).format(dateFormat));
      if (visit.endDate !== null) label.push(` - ${moment(visit.endDate).format(dateFormat)}`);
      label.push(` (${capitalize(visit.visitType)})`);

      return {
        value: visit._id,
        label: label.concat(),
      };
    });
    return visits;
  },

  getCurrentAdmission() {
    // await this.fetch({ relations: ['visits'] });
    const { visits } = this.attributes;
    return visits.models.find(model => {
      const { visitType, endDate } = model.toJSON();
      return (visitType === 'admission' && endDate === null);
    });
  },

  getHistory() {
    let history = [];
    let { visits } = this.attributes;
    const parseHistoryObject = (objectType, collection, dateField = 'requestedDate') => {
      return collection.map(model => ({
        date: moment(model.get(dateField)).unix(),
        objectType,
        object: model.toJSON()
      }));
    }

    const appointments = this.get('appointments');
    history = history.concat(parseHistoryObject('appointment', appointments, 'startDate'));
    visits.forEach(visitModel => {
      const medication = visitModel.getMedication();
      const imagingRequests = visitModel.getImagingRequests();
      const labRequests = visitModel.getLabRequests();
      history = history
                .concat(parseHistoryObject('visit', [visitModel], 'startDate'))
                .concat(parseHistoryObject('medication', medication))
                .concat(parseHistoryObject('imagingRequest', imagingRequests))
                .concat(parseHistoryObject('labRequest', labRequests));
    });

    history = history.sort(( objectA, objectB ) => objectB.date - objectA.date);
    return history;
  },

  getMedication() {
    const { visits } = this.attributes;
    let medications = [];
    visits.models.forEach(visit => {
      const { medication } = visit.attributes;
      medications = concat(medications, medication.models);
    });
    return medications;
  },

  getMedicationHistory(from = moment().subtract(1, 'days'), to = moment().add(1, 'days')) {
    const medication = [];
    const allMedication = this.getMedication();
    while (from.isSameOrBefore(to)) {
      const date = from.clone();
      medication.push({
        date: date.format(dateFormat),
        medication: allMedication.filter(({ attributes }) => {
          return (date.isSameOrAfter(attributes.prescriptionDate) && (date.isSameOrBefore(attributes.endDate) || attributes.endDate === null));
        })
      });
      from.add(1, 'days');
    }
    return medication;
  },

  getImagingRequests() {
    const { attributes: { visits } } = this;
    let allImagingRequests = [];
    visits.models.forEach(visitModel => {
      const { imagingRequests } = visitModel.toJSON();
      allImagingRequests = allImagingRequests.concat(imagingRequests);
    })
    return allImagingRequests;
  },

  getLabRequests() {
    const { attributes: { visits } } = this;
    const labRequestsCollection = new LabRequestsCollection({}, { mode: 'client' });
    visits.models.forEach(visitModel => {
      const labRequests = visitModel.get('labRequests');
      if (labRequests) {
        labRequestsCollection.add(
          labRequests
            .where({ status: LAB_REQUEST_STATUSES.VERIFIED })
            .filter(({ attributes: { tests } }) => (
              tests.some(test => test.attributes.result != null)
            ))
        );
      }
    })
    return labRequestsCollection;
  },

  getLabTests(labRequests = this.getLabRequests()) {
    let labTests = [];
    labRequests.forEach(async ({ tests }) => {
      labTests = labTests.concat(tests);
    });
    return labTests;
  }
});
