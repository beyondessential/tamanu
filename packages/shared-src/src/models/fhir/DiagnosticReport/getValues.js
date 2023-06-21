import config from 'config';

import { FHIR_DIAGNOSTIC_REPORT_STATUS, LAB_REQUEST_STATUSES } from 'shared/constants';

import {
  FhirCodeableConcept,
  FhirCoding,
  FhirExtension,
  FhirIdentifier,
  FhirReference,
} from '../../../services/fhirTypes';
import { formatFhirDate } from '../../../utils/fhir';

export async function getValues(upstream, models) {
  const { LabTest } = models;

  if (upstream instanceof LabTest) return getValuesFromLabTest(upstream);
  throw new Error(`Invalid upstream type for service request ${upstream.constructor.name}`);
}

async function getValuesFromLabTest(labTest) {
  const { labTestType, labTestMethod, labRequest } = labTest;
  const { encounter, laboratory } = labRequest;
  const { patient, examiner } = encounter;

  return {
    lastUpdated: new Date(),
    extension: extension(labTestMethod),
    identifier: identifiers(labRequest),
    status: status(labRequest),
    code: code(labTestType),
    subject: patientReference(patient),
    effectiveDateTime: formatFhirDate(labRequest.sampleTime),
    issued: formatFhirDate(labRequest.requestedDate),
    performer: performer(laboratory, examiner),
    result: result(labTest, labRequest),
  };
}

function extension(labTestMethod) {
  if (!labTestMethod) {
    return [];
  }

  const groupNamespace = `${config.hl7.dataDictionaries.testMethod}/covid-test-methods`;
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

function identifiers(labRequest) {
  return [
    new FhirIdentifier({
      use: 'official',
      system: config.hl7.dataDictionaries.labRequestDisplayId,
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
