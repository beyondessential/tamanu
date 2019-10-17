import defaults from './defaults';

export const VisitSchema = {
  name: 'visit',
  primaryKey: '_id',
  properties: {
    _id: 'string',

    visitType: { type: 'string', indexed: true },

    startDate: { type: 'date', default: new Date(), indexed: true },
    endDate: { type: 'date', optional: true, indexed: true },
    reasonForVisit: { type: 'string', optional: true },

    // has-one
    examiner: { type: 'user', optional: true },

    location: 'location',
    department: 'department',
    plannedLocation: 'location?',

    dischargePhysician: { type: 'user', optional: true },
    dischargeNotes: { type: 'string', optional: true },

    // has-many
    medications: { type: 'list', objectType: 'medication' },
    diagnoses: { type: 'list', objectType: 'patientDiagnosis' },
    labRequests: { type: 'list', objectType: 'labRequest' },
    imagingRequests: { type: 'list', objectType: 'imagingRequest' },
    notes: { type: 'list', objectType: 'note' },
    procedures: { type: 'list', objectType: 'procedure' },
    vitals: { type: 'list', objectType: 'vitals' },
    reports: { type: 'list', objectType: 'report' },
    operativePlans: { type: 'list', objectType: 'operativePlan' },
    operationReports: { type: 'list', objectType: 'operationReport' },

    // reverse links
    patient: { type: 'linkingObjects', objectType: 'patient', property: 'visits' },

    ...defaults,
  },
};
