const Backbone = require('backbone-associations');
const shortid = require('shortid');
const {
  AllergyModel,
  DiagnosisModel,
  OperativePlanModel,
  OperationReportModel
} = require('./index');

export default Backbone.Model.extend({
  idAttribute: '_id',
  defaults: () => {
    const _id = shortid.generate();

    return {
      _id: `patient_${_id}`,
      type: 'patient',
      displayId: '',
      admitted: false,
      additionalContacts: [],
      address: '',
      address2: '',
      address3: '',
      address4: '',
      bloodType: '',
      clinic: '',
      country: '',
      checkedIn: false,
      dateOfBirth: Date,
      economicClassification: '',
      email: '',
      externalPatientId: '',
      familySupport1: '',
      familySupport2: '',
      familySupport3: '',
      familySupport4: '',
      familySupport5: '',
      familyInfo: [],
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
      referredDate: Date,
      referredBy: '',
      religion: '',
      socialActionTaken: '',
      socialRecommendation: '',
      status: '',
      allergies: [],
      diagnoses: [],
      operationReports: [],
      operativePlans: [],
    };
  },

  // Associations
  relations: [
    {
      type: Backbone.Many,
      key: 'allergies',
      relatedModel: AllergyModel
    },
    {
      type: Backbone.Many,
      key: 'diagnoses',
      relatedModel: DiagnosisModel
    },
    {
      type: Backbone.Many,
      key: 'operationReports',
      relatedModel: OperationReportModel
    },
    {
      type: Backbone.Many,
      key: 'operativePlans',
      relatedModel: OperativePlanModel
    }
  ],

  validate: (attrs) => {
    if (attrs.firstName === '') return 'firstName is required!';
    if (attrs.lastName === '') return 'lastName is required!';
  }
});
