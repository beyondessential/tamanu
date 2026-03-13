export const globalTestSettings = {
  auth: {
    restrictUsersToFacilities: false,
    restrictUsersToSync: false,
  },
  appointments: {
    maxRepeatingAppointmentsPerGeneration: 10,
  },
  fhir: {
    worker: {
      resourceMaterialisationEnabled: {
        Patient: true,
        Encounter: true,
        Immunization: true,
        MediciReport: true,
        Organization: true,
        Practitioner: true,
        ServiceRequest: true,
        Specimen: true,
        MedicationRequest: true,
        DiagnosticReport: true,
      },
    },
    parameters: {
      _count: {
        default: 100,
        max: 1000,
      },
    },
    extensions: {
      Patient: {
        newZealandEthnicity: false,
      },
    },
  },
};
