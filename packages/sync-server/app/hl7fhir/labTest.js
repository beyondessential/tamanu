import config from 'config';
import { LAB_TEST_STATUSES } from 'shared/constants';

// fine to hardcode this one -- HL7 guarantees it will always be available at this url
const HL7_OBSERVATION_TERMINOLOGY_URL =
  'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation';

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
      return 'final';
    case LAB_TEST_STATUSES.RESULTS_PENDING:
      return 'registered';
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

export async function labTestToHL7DiagnosticReport(labTest) {
  const labTestType = await labTest.getLabTestType();
  const labTestMethod = await labTest.getLabTestMethod();
  const labRequest = await labTest.getLabRequest();
  const encounter = await labRequest.getEncounter();
  const patient = await encounter.getPatient();
  const examiner = await encounter.getExaminer();
  const laboratory = await labRequest.getLaboratory();

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
    status: labTestStatusToHL7Status(labTest.status),
    effectiveDateTime: labRequest.sampleTime,
    issued: labRequest.requestedDate,
    code: {
      text: labTestType.name,
      coding: [
        {
          code: labTestType.code,
          display: labTestType.name,
        },
      ],
    },
    performer: [laboratory ? laboratoryToHL7Reference(laboratory) : userToHL7Reference(examiner)],
    result: shouldProduceObservation(labTest.status)
      ? [{ reference: `Observation/${labTest.id}` }]
      : [],
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
      throw new Error(`Test coding was not one of [${values}]`);
    }
  }
}

export async function labTestToHL7Observation(labTest, maybePatient) {
  if (!shouldProduceObservation(labTest.status)) {
    return null;
  }

  let patient = maybePatient;
  if (!patient) {
    const labRequest = await labTest.getLabRequest();
    const encounter = await labRequest.getEncounter();
    patient = await encounter.getPatient();
  }

  return {
    resourceType: 'Observation',
    id: labTest.id,
    status: labTestStatusToHL7Status(labTest.status),
    subject: patientToHL7Reference(patient),
    code: {}, // TODO: mapping tbd (empty object included so that it validates)
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
