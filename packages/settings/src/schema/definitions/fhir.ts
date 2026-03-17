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
  type: yup.number().integer().positive(),
  defaultValue: 10,
};

export const fhirCountParametersSchema = {
  name: 'Parameters',
  description: 'FHIR search parameter configuration',
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

export const fhirNullLastNameSchema = {
  name: 'Null last name value',
  description: 'Value sent in place of a missing patient last name in HL7/FHIR resources',
  requiresRestart: true,
  type: yup.string(),
  defaultValue: 'NoLastName',
};

export const fhirAssignersSchema = {
  name: 'Assigners',
  description: 'Assigner display values used in FHIR Identifier references',
  requiresRestart: true,
  properties: {
    patientDisplayId: {
      name: 'Patient display ID assigner',
      description: 'Assigner for the primary patient display identifier',
      type: yup.string(),
      defaultValue: 'Tamanu',
    },
    patientDrivingLicense: {
      name: 'Driving license assigner',
      description: 'Assigner for patient driving license identifiers',
      type: yup.string(),
      defaultValue: 'RTA',
    },
    patientPassport: {
      name: 'Passport assigner',
      description: 'Assigner for patient passport identifiers',
      type: yup.string(),
      defaultValue: 'Fiji Passport Office',
    },
  },
};

const fhirDataDictionaryString = (description: string, defaultValue: string) => ({
  description,
  requiresRestart: true,
  type: yup.string(),
  defaultValue,
});

export const fhirDataDictionariesSchema = {
  name: 'Data dictionaries',
  description: 'URI systems and code systems used in FHIR resource identifiers and codings',
  requiresRestart: true,
  properties: {
    testMethod: fhirDataDictionaryString('COVID test method system', 'http://tamanu.io/data-dictionary/covid-test-methods'),
    patientDisplayId: fhirDataDictionaryString('Patient display ID system', 'http://tamanu.io/data-dictionary/application-reference-number.html'),
    labRequestDisplayId: fhirDataDictionaryString('Lab request display ID system', 'http://tamanu.io/data-dictionary/labrequest-reference-number.html'),
    areaExternalCode: fhirDataDictionaryString('Area external code system', 'http://data-dictionary.tamanu-fiji.org/rispacs-billing-code.html'),
    encounterClass: fhirDataDictionaryString('Encounter class system', 'http://terminology.hl7.org/CodeSystem/v3-ActCode'),
    pharmacyOrderPrescriptionId: fhirDataDictionaryString('Pharmacy order prescription ID system', 'http://data-dictionary.tamanu.org/tamanu-mrid-pharmacyorderprescription.html'),
    pharmacyOrderId: fhirDataDictionaryString('Pharmacy order ID system', 'http://data-dictionary.tamanu.org/tamanu-mrid-pharmacyorder.html'),
    medicationCodeSystem: fhirDataDictionaryString('Medication code system', 'http://data-dictionary.tamanu.org/tamanu-msupplyuniveralcodes.html'),
    medicationRouteCodeSystem: fhirDataDictionaryString('Medication route code system', 'http://data-dictionary.tamanu.org/tamanu-medicationroutecodes.html'),
    serviceRequestImagingDisplayId: fhirDataDictionaryString('ServiceRequest imaging display ID system', 'http://data-dictionary.tamanu-fiji.org/tamanu-mrid-imagingrequest.html'),
    serviceRequestImagingId: fhirDataDictionaryString('ServiceRequest imaging ID system', 'http://data-dictionary.tamanu-fiji.org/tamanu-id-imagingrequest.html'),
    serviceRequestImagingTypeCodeSystem: fhirDataDictionaryString('Imaging type code system', 'http://tamanu.io/data-dictionary/imaging-type-code.html'),
    serviceRequestLabDisplayId: fhirDataDictionaryString('ServiceRequest lab display ID system', 'http://data-dictionary.tamanu-fiji.org/tamanu-mrid-labrequest.html'),
    serviceRequestLabId: fhirDataDictionaryString('ServiceRequest lab ID system', 'http://data-dictionary.tamanu-fiji.org/tamanu-id-labrequest.html'),
    serviceRequestLabPanelCodeSystem: fhirDataDictionaryString('Lab panel code system', 'https://www.senaite.com/profileCodes.html'),
    serviceRequestLabPanelExternalCodeSystem: fhirDataDictionaryString('Lab panel external code system', 'http://loinc.org'),
    serviceRequestLabTestCodeSystem: fhirDataDictionaryString('Lab test code system', 'https://www.senaite.com/testCodes.html'),
    serviceRequestLabTestExternalCodeSystem: fhirDataDictionaryString('Lab test external code system', 'http://loinc.org'),
    imagingStudyAccessionId: fhirDataDictionaryString('Imaging study accession ID system', 'http://data-dictionary.tamanu-fiji.org/ris-accession-number.html'),
    ethnicityId: fhirDataDictionaryString('Ethnicity code system', 'http://data-dictionary.tamanu-fiji.org/extensions/ethnic-group-code.html'),
    locationPhysicalType: fhirDataDictionaryString('Location physical type system', 'http://terminology.hl7.org/CodeSystem/location-physical-type'),
    specimenType: fhirDataDictionaryString('Specimen type system', 'http://www.senaite.com/data/sample_types'),
    sampleBodySite: fhirDataDictionaryString('Sample body site system', 'http://bodySITE.NEW'),
    ips: {
      name: 'IPS data dictionaries',
      description: 'Code systems used in International Patient Summary bundles',
      requiresRestart: true,
      properties: {
        medicationEncoding: fhirDataDictionaryString('IPS medication encoding system', 'http://nzmt.org.nz'),
        allergyIntoleranceEncoding: fhirDataDictionaryString('IPS allergy intolerance encoding system', 'http://snomed.info/sct'),
        conditionEncoding: fhirDataDictionaryString('IPS condition encoding system', 'http://snomed.info/sct'),
        immunizationEncoding: fhirDataDictionaryString('IPS immunization encoding system', 'http://nzmt.org.nz'),
        absentUnknown: fhirDataDictionaryString('IPS absent/unknown code system', 'http://hl7.org/fhir/uv/ips/CodeSystem/absent-unknown-uv-ips'),
      },
    },
  },
};
