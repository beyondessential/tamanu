const Backbone = require('backbone');
const shortid = require('shortid');

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
      customForms: {},
      dateOfBirth: Date,
      economicClassification: '',
      email: '',
      expenses: [],
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
      // Associations
      // allergies: DS.hasMany('allergy', { async: true }),
      // diagnoses: DS.hasMany('diagnosis', { async: false }),
      // operationReports: DS.hasMany('operation-report', { async: true }),
      // operativePlans: DS.hasMany('operative-plan', { async: true }),
      // payments: DS.hasMany('payment', { async: true }),
      // paymentProfile: DS.belongsTo('price-profile', { async: false }),
    };
  },

  validate: (attrs) => {
    if (attrs.firstName === '') return 'firstName is required!';
    if (attrs.lastName === '') return 'lastName is required!';
  }
});
