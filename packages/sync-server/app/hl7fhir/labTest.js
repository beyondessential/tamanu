import config from 'config';
import { LAB_REQUEST_STATUSES, LAB_TEST_STATUSES } from 'shared/constants';

// fine to hardcode this one -- HL7 guarantees it will always be available at this url
const HL7_OBSERVATION_TERMINOLOGY_URL = "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation";

// TODO: real urls
const TAMANU_DATADICT_URL = "http://tamanu.io/data-dictionary";
const TAMANU_COVID_URL = `${TAMANU_DATADICT_URL}/covid-test-methods`;
const TAMANU_COVID_CODE_URL = `${TAMANU_COVID_URL}/rdt`;

function shouldProduceObservation(status) {
  switch (status) {
    case LAB_TEST_STATUSES.PUBLISHED:
      return true;
    default: 
      return false;
  }
}

function labTestStatusToHL7Status(status) {
  switch (status) {
    case LAB_TEST_STATUSES.PUBLISHED:
      return "final";
    default:
      return status;
  }
}

function patientToHL7Reference(patient) {
  return {
    reference: `Patient/${patient.id}`,
    name: [patient.firstName, patient.lastName].filter(x => x).join(' '),
  };
}

function userToHL7Reference(user) {
  return {
    reference: `Practitioner/${user.id}`,
    name: user.displayName,
  };
}

function laboratoryToHL7Reference(laboratory) {
  return {
    reference: `Organization/${laboratory.id}`,
    name: laboratory.name,
  };
}

function labTestMethodToHL7Extension(labTestMethod) {
  if (!labTestMethod) { return []; }

  return [
    {
      url: TAMANU_COVID_URL,
      valueCodeableConcept: {
        coding: [
          {
            system: TAMANU_COVID_CODE_URL,
            code: labTestMethod.code,
            display: labTestMethod.name,
          },
        ],
      },
    },
  ];
}

export async function labTestToHL7DiagnosticReport(labTest) {
  const labTestType = await labTest.getLabTestType();
  const labTestMethod = await labTest.getLabTestMethod();
  const labRequest = await labTest.getLabRequest();
  const encounter = await labRequest.getEncounter();
  const patient = await encounter.getPatient();
  const examiner = await encounter.getExaminer();
  const laboratory = await labRequest.getLaboratory();

  return {
    resourceType: "DiagnosticReport",
    id: labTest.id,
    identifier: [
      {
        use: "official",
        system: config.namespaces.labRequestDisplayId,
        value: labRequest.displayId,
      },
    ],
    subject: patientToHL7Reference(patient),
    status: labTestStatusToHL7Status(labTest.status),
    effectiveDateTime: labRequest.sampleTime,
    issued: labRequest.requestedDate,
    code: {
      text: labTestType.name,
      coding: [
        { 
          code: labTestType.code, 
          name: labTestType.name,
        },
      ],
    },
    performer: laboratory 
      ? laboratoryToHL7Reference(laboratory)
      : userToHL7Reference(examiner), 
    result: shouldProduceObservation(labTest.status)
      ? [ { reference: `Observation/${labTest.id}` } ]
      : [],
    extension: labTestMethodToHL7Extension(labTestMethod),
  };
}

// The result field is freetext, these values are defined in the LabTestType
// reference data spreadsheet.
const TEST_RESULTS = {
  POSITIVE: "Positive",
  NEGATIVE: "Negative",
  INCONCLUSIVE: "Inconclusive",
};

function getResultCoding(labTest) {
  switch (labTest.result) {
    case TEST_RESULT_VALUES.POSITIVE:
      return { code: "POS", name: "Positive" };
    case TEST_RESULT_VALUES.NEGATIVE:
      return { code: "NEG", name: "Negative" };
    case TEST_RESULT_VALUES.INCONCLUSIVE:
    default: // TODO: is there an errored / N/A value we can return?
      return { code: "INC", name: "Inconclusive" };
  }
}

export function labTestToHL7Observation(labTest, patient) {
  if (!shouldProduceObservation(labTest.status)) {
    return null;
  }

  return {
    resourceType: "Observation",
    id: labTest.id,
    status: labTestStatusToHL7Status(labTest.status),
    subject: patientToHL7Reference(patient),
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

