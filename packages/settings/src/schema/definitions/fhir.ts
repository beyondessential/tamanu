import * as yup from 'yup';

export const fhirResourceMaterialisationSchema = {
  name: 'Resource materialisation',
  description: 'Enable or disable materialisation for each FHIR resource type',
  requiresRestart: true,
  properties: {
    Patient: {
      name: 'Patient',
      description: 'Materialise Patient resources from Tamanu patient records',
      type: yup.boolean(),
      defaultValue: true,
    },
    Encounter: {
      name: 'Encounter',
      description: 'Materialise Encounter resources from Tamanu encounters',
      type: yup.boolean(),
      defaultValue: false,
    },
    Immunization: {
      name: 'Immunization',
      description: 'Materialise Immunization resources from Tamanu vaccination records',
      type: yup.boolean(),
      defaultValue: false,
    },
    MediciReport: {
      name: 'MediciReport',
      description: 'Materialise MediciReport resources for Medici integration',
      type: yup.boolean(),
      defaultValue: false,
    },
    Organization: {
      name: 'Organization',
      description: 'Materialise Organization resources from Tamanu facilities',
      type: yup.boolean(),
      defaultValue: false,
    },
    Practitioner: {
      name: 'Practitioner',
      description: 'Materialise Practitioner resources from Tamanu users',
      type: yup.boolean(),
      defaultValue: false,
    },
    ServiceRequest: {
      name: 'ServiceRequest',
      description: 'Materialise ServiceRequest resources from Tamanu imaging and lab requests',
      type: yup.boolean(),
      defaultValue: false,
    },
    Specimen: {
      name: 'Specimen',
      description: 'Materialise Specimen resources from Tamanu lab request samples',
      type: yup.boolean(),
      defaultValue: false,
    },
    MedicationRequest: {
      name: 'MedicationRequest',
      description: 'Materialise MedicationRequest resources from Tamanu prescriptions',
      type: yup.boolean(),
      defaultValue: false,
    },
    DiagnosticReport: {
      name: 'DiagnosticReport',
      description: 'Materialise DiagnosticReport resources from Tamanu lab results',
      type: yup.boolean(),
      defaultValue: false,
    },
  },
};

export const fhirExtensionsSchema = {
  name: 'Extensions',
  description: 'FHIR resource extension configuration',
  requiresRestart: true,
  properties: {
    Patient: {
      name: 'Patient extensions',
      description: 'Extensions applied to FHIR Patient resources during materialisation',
      properties: {
        newZealandEthnicity: {
          name: 'New Zealand ethnicity',
          description: 'Include NZ ethnicity extension on materialised Patient resources',
          type: yup.boolean(),
          defaultValue: false,
        },
      },
    },
  },
};

export const fhirWorkerConcurrencySchema = {
  name: 'Concurrency',
  description: 'Maximum number of FHIR jobs processed simultaneously by the worker',
  requiresRestart: true,
  type: yup.number().integer().positive(),
  defaultValue: 10,
};

export const fhirCountParametersSchema = {
  name: 'Parameters',
  description: 'FHIR search parameter configuration',
  requiresRestart: true,
  properties: {
    _count: {
      name: 'Count',
      description: 'Controls how many resources are returned per page in FHIR search results',
      properties: {
        default: {
          name: 'Default count',
          description: 'Number of resources returned per page when _count is not specified in the request',
          type: yup.number().integer().positive(),
          defaultValue: 100,
        },
        max: {
          name: 'Max count',
          description: 'Upper limit for the _count parameter; requests above this value are capped',
          type: yup.number().integer().positive(),
          defaultValue: 1000,
        },
      },
    },
  },
};
