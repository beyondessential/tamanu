import config from 'config';
import { format } from 'date-fns';

function patientName(patient, additional) {
  const official = {
    use: 'official',
    prefix: additional.title ? [additional.title] : [],
    // lastName is not a mandatory field in Tamanu, but is in HL7
    // Some patients genuinely do not have last names, so, just send
    // a preconfigured string in this circumstance.
    family: patient.lastName || config.hl7.nullLastNameValue,
    given: [patient.firstName, patient.middleName].filter(x => x),
  };

  if (!patient.culturalName) {
    return [official];
  }

  return [
    official,
    {
      use: 'nickname',
      text: patient.culturalName,
    },
  ];
}

function patientIds(patient, additional) {
  return [
    {
      use: 'usual',
      value: patient.id,
    },
    {
      use: 'official',
      value: patient.displayId,
      assigner: config.hl7.assigners.patientDisplayId,
      system: config.hl7.dataDictionaries.patientDisplayId,
    },
    {
      use: 'secondary',
      assigner: 'Fiji Passport Office',
      value: additional.passportNumber,
    },
    {
      use: 'secondary',
      assigner: 'RTA',
      value: additional.drivingLicense,
    },
  ].filter(x => x.value);
}

function patientAddress(patient, additional) {
  const { cityTown, streetVillage } = additional;
  if (!cityTown && !streetVillage) return [];
  return [
    {
      type: 'physical',
      use: 'home',
      city: additional.cityTown,
      line: additional.streetVillage ? [additional.streetVillage] : [],
    },
  ];
}

function patientTelecom(patient, additional) {
  return [additional.primaryContactNumber, additional.secondaryContactNumber]
    .filter(x => x)
    .map((value, index) => ({
      rank: index + 1,
      value,
    }));
}

export function patientToHL7Patient(patient, additional) {
  return {
    resourceType: 'Patient',
    active: true, // currently unused in Tamanu, always true
    identifier: patientIds(patient, additional),
    name: patientName(patient, additional),
    birthDate: patient.dateOfBirth && format(patient.dateOfBirth, 'yyyy-MM-dd'),
    gender: patient.sex,
    address: patientAddress(patient, additional),
    telecom: patientTelecom(patient, additional),
  };
}
