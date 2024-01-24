import { FHIR_DIAGNOSTIC_REPORT_STATUS, LAB_REQUEST_STATUSES } from '@tamanu/constants';
import {
  FhirCodeableConcept,
  FhirCoding,
  FhirExtension,
  FhirIdentifier,
  FhirReference,
} from '../../../services/fhirTypes';
import { formatFhirDate } from '../../../utils/fhir';

export async function getValues(upstream, models, settings) {
  const { LabTest } = models;

  if (upstream instanceof LabTest) return getValuesFromLabTest(upstream, settings);
  throw new Error(`Invalid upstream type for service request ${upstream.constructor.name}`);
}

async function getValuesFromLabTest(labTest, settings) {
  const { labTestType, labTestMethod, labRequest } = labTest;
  const { encounter, laboratory } = labRequest;
  const { patient, examiner } = encounter;

  return {
    lastUpdated: new Date(),
    extension: await extension(labTestMethod, settings),
    identifier: await identifiers(labRequest, settings),
    status: status(labRequest),
    code: code(labTestType),
    subject: patientReference(patient),
    effectiveDateTime: formatFhirDate(labRequest.sampleTime),
    issued: formatFhirDate(labRequest.requestedDate),
    performer: performer(laboratory, examiner),
    result: result(labTest, labRequest),
  };
}

async function extension(labTestMethod, settings) {
  if (!labTestMethod) {
    return [];
  }

  const testMethodDataDictionary = await settings.get('hl7.dataDictionaries.testMethod');

  const groupNamespace = `${testMethodDataDictionary}/covid-test-methods`;
  const testsNamespace = `${groupNamespace}/rdt`;

  return [
    new FhirExtension({
      url: groupNamespace,
      valueCodeableConcept: new FhirCodeableConcept({
        coding: [
          new FhirCoding({
            system: testsNamespace,
            code: labTestMethod.code,
            display: labTestMethod.name,
          }),
        ],
      }),
    }),
  ];
}

async function identifiers(labRequest, settings) {
  const labRequestDisplayIdDict = await settings.get('hl7.dataDictionaries.labRequestDisplayId');
  return [
    new FhirIdentifier({
      use: 'official',
      system: labRequestDisplayIdDict,
      value: labRequest.displayId,
    }),
  ];
}

function status(labRequest) {
  switch (labRequest.status) {
    case LAB_REQUEST_STATUSES.PUBLISHED:
      return FHIR_DIAGNOSTIC_REPORT_STATUS.FINAL;
    case LAB_REQUEST_STATUSES.TO_BE_VERIFIED:
    case LAB_REQUEST_STATUSES.VERIFIED:
      return FHIR_DIAGNOSTIC_REPORT_STATUS.PARTIAL.PRELIMINARY;
    case LAB_REQUEST_STATUSES.RECEPTION_PENDING:
    case LAB_REQUEST_STATUSES.RESULTS_PENDING:
      return FHIR_DIAGNOSTIC_REPORT_STATUS.REGISTERED;
    case LAB_REQUEST_STATUSES.CANCELLED:
      return FHIR_DIAGNOSTIC_REPORT_STATUS.CANCELLED;
    case LAB_REQUEST_STATUSES.ENTERED_IN_ERROR:
      return FHIR_DIAGNOSTIC_REPORT_STATUS.ENTERED_IN_ERROR;
    default:
      return FHIR_DIAGNOSTIC_REPORT_STATUS.UNKNOWN;
  }
}

function code(labTestType) {
  return new FhirCodeableConcept({
    text: labTestType.name,
    coding: [
      new FhirCoding({
        code: labTestType.code,
        display: labTestType.name,
      }),
    ],
  });
}

function patientReference(patient) {
  return new FhirReference({
    reference: `Patient/${patient.id}`,
    display: [patient.firstName, patient.lastName].filter(x => x).join(' '),
  });
}

function performer(laboratory, examiner) {
  return [
    laboratory &&
      new FhirReference({
        reference: `Organization/${laboratory.id}`,
        display: laboratory.name,
      }),
    new FhirReference({
      reference: `Practitioner/${examiner.id}`,
      display: examiner.displayName,
    }),
  ].filter(x => x);
}

function result(labTest, labRequest) {
  if (labRequest.status !== LAB_REQUEST_STATUSES.PUBLISHED) {
    return [];
  }

  return [
    new FhirReference({
      reference: `Observation/${labTest.id}`,
    }),
  ];
}
