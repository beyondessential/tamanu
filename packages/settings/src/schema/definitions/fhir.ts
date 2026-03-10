import * as yup from 'yup';

export const fhirResourceMaterialisationSchema = {
  name: 'Resource materialisation',
  description: 'Enable or disable materialisation for each FHIR resource type',
  requiresRestart: true,
  properties: {
    Patient: {
      name: 'Patient',
      type: yup.boolean(),
      defaultValue: true,
    },
    Encounter: {
      name: 'Encounter',
      type: yup.boolean(),
      defaultValue: false,
    },
    Immunization: {
      name: 'Immunization',
      type: yup.boolean(),
      defaultValue: false,
    },
    MediciReport: {
      name: 'MediciReport',
      type: yup.boolean(),
      defaultValue: false,
    },
    Organization: {
      name: 'Organization',
      type: yup.boolean(),
      defaultValue: false,
    },
    Practitioner: {
      name: 'Practitioner',
      type: yup.boolean(),
      defaultValue: false,
    },
    ServiceRequest: {
      name: 'ServiceRequest',
      type: yup.boolean(),
      defaultValue: false,
    },
    Specimen: {
      name: 'Specimen',
      type: yup.boolean(),
      defaultValue: false,
    },
    MedicationRequest: {
      name: 'MedicationRequest',
      type: yup.boolean(),
      defaultValue: false,
    },
    DiagnosticReport: {
      name: 'DiagnosticReport',
      type: yup.boolean(),
      defaultValue: false,
    },
  },
};

export const fhirCountParametersSchema = {
  name: 'Parameters',
  description: 'FHIR search parameter configuration',
  requiresRestart: true,
  properties: {
    _count: {
      name: 'Count',
      description: 'Pagination count parameter settings',
      properties: {
        default: {
          name: 'Default count',
          description: 'Default number of resources returned per page',
          type: yup.number().integer().positive(),
          defaultValue: 100,
        },
        max: {
          name: 'Max count',
          description: 'Maximum allowed value for the _count parameter',
          type: yup.number().integer().positive(),
          defaultValue: 1000,
        },
      },
    },
  },
};
