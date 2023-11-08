import config from 'config';
import { LAB_REQUEST_STATUSES } from '@tamanu/constants';
import { convertISO9075toRFC3339 } from '@tamanu/shared/utils/dateTime';

import { labTestTypeToLOINCCode } from './loinc';

// fine to hardcode this one -- HL7 guarantees it will always be available at this url
const HL7_OBSERVATION_TERMINOLOGY_URL =
  'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation';

function shouldProduceObservation(status) {
  switch (status) {
    case LAB_REQUEST_STATUSES.PUBLISHED:
      return true;
    default:
      return false;
  }
}

function labRequestStatusToHL7Status(status) {
  switch (status) {
    case LAB_REQUEST_STATUSES.PUBLISHED:
      return 'final';
    case LAB_REQUEST_STATUSES.RESULTS_PENDING:
      return 'registered';
    default:
      return status;
  }
}

export function hl7StatusToLabRequestStatus(status) {
  switch (status) {
    case 'final':
      return LAB_REQUEST_STATUSES.PUBLISHED;
    case 'registered':
      return LAB_REQUEST_STATUSES.RESULTS_PENDING;
    default:
      return status;
  }
}

function patientToHL7Reference(patient) {
  return {
    reference: `Patient/${patient.id}`,
    display: [patient.firstName, patient.lastName].filter(x => x).join(' '),
  };
}

function userToHL7Reference(user) {
  return {
    reference: `Practitioner/${user.id}`,
    display: user.displayName,
  };
}

function laboratoryToHL7Reference(laboratory) {
  return {
    reference: `Organization/${laboratory.id}`,
    display: laboratory.name,
  };
}

function labTestMethodToHL7Reference(labTestMethod) {
  return {
    reference: `Device/${labTestMethod.id}`,
    display: labTestMethodCodeToHL7DeviceText(labTestMethod?.code),
  };
}

function labTestMethodToHL7Extension(labTestMethod) {
  if (!labTestMethod) {
    return [];
  }

  const groupNamespace = `${config.hl7.dataDictionaries.testMethod}/covid-test-methods`;
  const testsNamespace = `${groupNamespace}/rdt`;

  return [
    {
      url: groupNamespace,
      valueCodeableConcept: {
        coding: [
          {
            system: testsNamespace,
            code: labTestMethod.code,
            display: labTestMethod.name,
          },
        ],
      },
    },
  ];
}

export function labTestToHL7DiagnosticReport(labTest) {
  const { labTestType, labTestMethod, labRequest } = labTest;
  const { encounter, laboratory } = labRequest;
  const { patient, examiner } = encounter;

  return {
    resourceType: 'DiagnosticReport',
    id: labTest.id,
    identifier: [
      {
        use: 'official',
        system: config.hl7.dataDictionaries.labRequestDisplayId,
        value: labRequest.displayId,
      },
    ],
    subject: patientToHL7Reference(patient),
    status: labRequestStatusToHL7Status(labRequest.status),
    effectiveDateTime: convertISO9075toRFC3339(labRequest.sampleTime),
    issued: convertISO9075toRFC3339(labRequest.requestedDate),
    code: {
      text: labTestType.name,
      coding: [
        {
          code: labTestType.code,
          display: labTestType.name,
        },
      ],
    },
    performer: laboratory
      ? [laboratoryToHL7Reference(laboratory), userToHL7Reference(examiner)]
      : [userToHL7Reference(examiner)],
    result: (() => {
      if (!shouldProduceObservation(labRequest.status)) {
        return [];
      }
      return [{ reference: `Observation/${labTest.id}` }];
    })(),
    extension: labTestMethodToHL7Extension(labTestMethod),
  };
}

// The result field is freetext, these values are defined in the LabTestType
// reference data spreadsheet.
const TEST_RESULT_VALUES = {
  POSITIVE: 'Positive',
  NEGATIVE: 'Negative',
  INCONCLUSIVE: 'Inconclusive',
};

function getResultCoding(labTest) {
  switch (labTest.result) {
    case TEST_RESULT_VALUES.POSITIVE:
      return { code: 'POS', display: 'Positive' };
    case TEST_RESULT_VALUES.NEGATIVE:
      return { code: 'NEG', display: 'Negative' };
    case TEST_RESULT_VALUES.INCONCLUSIVE:
      return { code: 'INC', display: 'Inconclusive' };
    default: {
      // The only way we can reach this point is if the actual testing data
      // is misconfigured (ie an error within Tamanu, we want to know ASAP)
      const values = Object.values(TEST_RESULT_VALUES).join(', ');
      throw new Error(`Test coding was not one of [${values}]: ${labTest.result}`);
    }
  }
}

export function labTestToHL7Observation(labTest) {
  const { labRequest, labTestType, labTestMethod } = labTest;
  const { patient } = labRequest.encounter;

  if (!shouldProduceObservation(labRequest.status)) {
    return null;
  }

  return {
    resourceType: 'Observation',
    id: labTest.id,
    status: labRequestStatusToHL7Status(labRequest.status),
    subject: patientToHL7Reference(patient),
    code: labTestTypeToLOINCCode(labTestType),
    device: labTestMethodToHL7Reference(labTestMethod),
    valueCodeableConcept: {
      coding: [
        {
          system: HL7_OBSERVATION_TERMINOLOGY_URL,
          ...getResultCoding(labTest),
        },
      ],
    },
  };
}

const KNOWN_LAB_TEST_METHOD_CODES = {
  GENE_XPERT: 'GeneXpert',
  RTPCR: 'RTPCR',
};

function labTestMethodCodeToHL7DeviceText(code) {
  switch (code) {
    case KNOWN_LAB_TEST_METHOD_CODES.GENE_XPERT:
      return 'COVID Gene-Xpert Testing Device';
    case KNOWN_LAB_TEST_METHOD_CODES.RTPCR:
      return 'COVID RT-PCR Testing Device';
    default:
      return 'Unknown';
  }
}

function labTestMethodCodeToHL7DeviceManufacturer(code) {
  switch (code) {
    case KNOWN_LAB_TEST_METHOD_CODES.GENE_XPERT:
      return 'Cepheid';
    case KNOWN_LAB_TEST_METHOD_CODES.RTPCR:
      return 'TIB MOLBIOL';
    default:
      return 'Unknown';
  }
}

export function labTestToHL7Device(labTest) {
  const code = labTest?.labTestMethod?.code;
  return {
    resourceType: 'Device',
    id: labTest.labTestMethod.id,
    text: labTestMethodCodeToHL7DeviceText(code),
    manufacturer: labTestMethodCodeToHL7DeviceManufacturer(code),
  };
}
