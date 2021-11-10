
const HL7_TERMINOLOGY_URL = "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation";

// TODO: namespace TBD (@kurt)
const NAMESPACE_FOR_LAB_REQUEST = "-- lab request namespace --";

// TODO: real urls
const TAMANU_COVID_URL = "http://tamanu.io/data-dictionary/covid-test-methods";
const TAMANU_COVID_CODE_URL = `${TAMANU_COVID_URL}/rdt`;

function labTestStatusToHL7Status(status) {
  switch (status) {
    case "published": return final;
    default: return status;
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

export async function labTestToHL7DiagnosticReport(labTest) {
  const labTestType = await labTest.getLabTestType();
  const labTestMethod = await labTest.getLabTestMethod();
  const labRequest = await labTest.getLabRequest();
  const encounter = await labRequest.getEncounter();
  const patient = await encounter.getPatient();
  const examiner = await encounter.getExaminer();

  return {
    resourceType: "DiagnosticReport",
    id: labTest.id,
    identifier: [
      {
        use: "official",
        system: NAMESPACE_FOR_LAB_REQUEST,
        value: labRequest.displayId,
      },
    ],
    status: labTestStatusToHL7Status(labTest.status),
    effectiveDateTime: labRequest.sampleTime,
    code: {
      text: labTestType.name,
      coding: [
        { 
          code: labTestType.code, 
          name: labTestType.name,
        },
      ],
    },
    subject: patientToHL7Reference(patient),
    performer: userToHL7Reference(examiner), // TODO: laboratory to take precedence over examiner
    issued: labRequest.requestedDate,
    result: [
      {
        reference: `Observation/${labTest.id}`,
      },
    ],
    extension: [
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
    ],
  };
}

function getResultCoding(labTest) {
  // TODO: smarter mapping?
  switch (labTest.result) {
    case "positive":
      return { code: "POS", name: "Positive" };
    case "negative": 
      return { code: "NEG", name: "Negative" };
    default: 
      return { code: "INC", name: "Inconclusive" };
  }
}

export function labTestToHL7Observation(labTest, patient) {
  // TODO: return null when status is reception_pending ?
  return {
    resourceType: "Observation",
    id: labTest.id, // TODO: OK to be the same as diagnostic report?
    status: labTestStatusToHL7Status(labTest.status),
    subject: patientToHL7Reference(patient),
    valueCodeableConcept: {
      coding: [
        {
          system: HL7_TERMINOLOGY_URL,
          ...getResultCoding(labTest),
        },
      ],
    },
  };
}

