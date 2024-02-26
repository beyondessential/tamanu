import { Op } from 'sequelize';

export function fromEncounters(models, table, id, deletedRow) {
  const {
    Encounter,
    EncounterHistory,

    ImagingRequest,
    ImagingRequestArea,

    LabRequest,
    LabTest,
    LabTestType,

    AdministeredVaccine,
    ScheduledVaccine,
    EncounterDiagnosis,
    EncounterMedication,

    Procedure,
    Discharge,
    Triage,
    Note,
    Patient,
    PatientBirthData,

    Location,
    LocationGroup,
    Department,
  } = models;

  switch (table) {
    case Encounter.tableName:
      return { where: { id } };

    case EncounterHistory.tableName:
      return {
        include: [
          {
            model: EncounterHistory,
            as: 'encounterHistory',
            required: true,
            where: { id },
          },
        ],
      };

    case ImagingRequest.tableName:
      return {
        include: [
          {
            model: ImagingRequest,
            as: 'imagingRequests',
            required: true,
            where: { id },
          },
        ],
      };

    case ImagingRequestArea.tableName:
      return {
        include: [
          {
            model: ImagingRequest,
            as: 'imagingRequests',
            required: true,
            include: [
              {
                model: ImagingRequestArea,
                required: true,
                where: { id },
              },
            ],
          },
        ],
      };

    case LabRequest.tableName:
      return {
        include: [
          {
            model: LabRequest,
            as: 'labRequests',
            required: true,
            where: { id },
          },
        ],
      };
    case LabTest.tableName:
      return {
        include: [
          {
            model: LabRequest,
            as: 'labRequests',
            required: true,
            include: [
              {
                model: LabTest,
                as: 'tests',
                required: true,
                where: { id },
              },
            ],
          },
        ],
      };
    case LabTestType.tableName:
      return {
        include: [
          {
            model: LabRequest,
            as: 'labRequests',
            required: true,
            include: [
              {
                model: LabTest,
                as: 'tests',
                required: true,
                include: [
                  {
                    model: LabTestType,
                    as: 'labTestType',
                    required: true,
                    where: { id },
                  },
                ],
              },
            ],
          },
        ],
      };

    case AdministeredVaccine.tableName:
      return {
        include: [
          {
            model: AdministeredVaccine,
            as: 'administeredVaccines',
            required: true,
            where: { id },
          },
        ],
      };

    case ScheduledVaccine.tableName:
      return {
        include: [
          {
            model: AdministeredVaccine,
            as: 'administeredVaccines',
            required: true,
            include: [
              {
                model: ScheduledVaccine,
                as: 'scheduledVaccine',
                required: true,
                where: { id },
              },
            ],
          },
        ],
      };

    case EncounterDiagnosis.tableName:
      return {
        include: [
          {
            model: EncounterDiagnosis,
            as: 'diagnoses',
            required: true,
            where: { id },
          },
        ],
      };

    case EncounterMedication.tableName:
      return {
        include: [
          {
            model: EncounterMedication,
            as: 'medications',
            required: true,
            where: { id },
          },
        ],
      };

    case Procedure.tableName:
      return {
        include: [
          {
            model: Procedure,
            as: 'procedures',
            required: true,
            where: { id },
          },
        ],
      };

    case Triage.tableName:
      return {
        include: [
          {
            model: Triage,
            as: 'triages',
            required: true,
            where: { id },
          },
        ],
      };

    case Note.tableName:
      return {
        include: [
          {
            model: Note,
            as: 'notes',
            required: true,
            where: { id },
          },
        ],
      };

    case Discharge.tableName:
      if (deletedRow) {
        return { where: { id: deletedRow.encounter_id } };
      }

      return {
        include: [
          {
            model: Discharge,
            as: 'discharge',
            required: true,
            where: { id },
          },
        ],
      };

    case Patient.tableName:
      return {
        include: [
          {
            model: Patient,
            as: 'patient',
            required: true,
            where: { id },
          },
        ],
      };

    case PatientBirthData.tableName:
      return {
        include: [
          {
            model: Patient,
            as: 'patient',
            required: true,
            include: [
              {
                model: PatientBirthData,
                as: 'birthData',
                required: true,
                where: { id },
              },
            ],
          },
        ],
      };

    case Location.tableName:
      return {
        include: [
          {
            model: Location,
            as: 'location',
            required: true,
            where: { id },
          },
        ],
      };

    case LocationGroup.tableName:
      return {
        include: [
          {
            model: Location,
            as: 'location',
            required: true,
            include: [
              {
                model: LocationGroup,
                as: 'locationGroup',
                required: true,
                where: { id },
              },
            ],
          },
        ],
      };

    case Department.tableName:
      return {
        include: [
          {
            model: Department,
            as: 'department',
            required: true,
            where: { id },
          },
        ],
      };

    default:
      return null;
  }
}
