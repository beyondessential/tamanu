
const NAMESPACE_FOR_APPLICATION_PERMIT_ID = "????";

function patientName(patient, additional) {
  const official = {
    use: "official",
    prefix: [additional.title],
    family: patient.lastName,
    given: [patient.firstName, patient.middleName].filter(x => x),
  };

  if (!patient.culturalName) {
    return [official];
  }

  return [
    official,
    {
      use: "nickname",
      text: patient.culturalName,
    }
  ];
}

function patientIds(patient, additional) {
  return [
    {
      use: "usual",
      value: patient.id,
    },
    {
      use: "official",
      value: patient.displayId,
      assigner: "VRS",
      system: NAMESPACE_FOR_APPLICATION_PERMIT_ID,
    },
    {
      use: "secondary",
      assigner: "Fiji Passport Office",
      value: additional.passportNumber,
    },
    {
      use: "secondary",
      assigner: "RTA",
      value: additional.drivingLicense,
    },
  ].filter(x => x.value);
}

function patientAddress(patient, additional) {
  const { cityTown, streetVillage } = additional;
  if (!cityTown && !streetVillage) return [];
  return [
    {
      type: "physical",
      use: "home",
      city: additional.cityTown,
      line: additional.streetVillage,
    }
  ];
}

function patientTelecom(patient, additional) {
  return [
    additional.primaryContactNumber, 
    additional.secondaryContactNumber
  ].filter(x => x).map((value, index) => ({
    rank: index + 1,
    value
  }));
}

export function patientToHL7Patient(patient, additional) {
  return {
    resourceType: "Patient",
    // TODO: how to tell if active? all patients?
    active: true,
    // TODO: DoB? not necessary?
    name: patientName(patient, additional),
    gender: patient.sex,
    identifier: patientIds(patient, additional),
    address: patientAddress(patient, additional),
    telecom: patientTelecom(patient, additional),
  };
}


