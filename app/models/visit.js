const Backbone = require('backbone-associations');
const shortid = require('shortid');
const {
  DiagnosisModel,
  LabModel,
  PatientNoteModel,
  ProcedureModel,
  MedicationModel,
  VitalModel,
  ReportModel,
} = require('./index');

export default Backbone.Model.extend({
  idAttribute: '_id',
  defaults: () => {
    const _id = shortid.generate();

    return {
      _id: `lab_${_id}`,
      docType: 'lab',
      dischargeInfo: null,
      endDate: Date, // if visit type is outpatient, startDate and endDate are equal
      examiner: null,
      hasAppointment: false,
      location: null,
      outPatient: false,
      paymentState: 'Pending',
      primaryBillingDiagnosis: null, // AKA final diagnosis
      primaryBillingDiagnosisId: null,
      reasonForVisit: null,
      startDate: Date,
      status: null,
      visitType: null,
      diagnoses: [],
      labs: [],
      medication: [],
      patientNotes: [],
      procedures: [],
      vitals: [],
      reports: [],
    };
  },

  // Associations
  relations: [
    {
      type: Backbone.Many,
      key: 'diagnoses',
      relatedModel: DiagnosisModel
    },
    {
      type: Backbone.Many,
      key: 'labs',
      relatedModel: LabModel
    },
    {
      type: Backbone.Many,
      key: 'medication',
      relatedModel: MedicationModel
    },
    {
      type: Backbone.Many,
      key: 'patientNotes',
      relatedModel: PatientNoteModel
    },
    {
      type: Backbone.Many,
      key: 'procedures',
      relatedModel: ProcedureModel
    },
    {
      type: Backbone.Many,
      key: 'vitals',
      relatedModel: VitalModel
    },
    {
      type: Backbone.Many,
      key: 'reports',
      relatedModel: ReportModel
    },
  ]

  // validate: (attrs) => {
  //   if (attrs.firstName === '') return 'firstName is required!';
  //   if (attrs.lastName === '') return 'lastName is required!';
  // }
});
